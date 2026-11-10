const db = require('../config/db')
const { transitionOrderStatus } = require('../services/orderWorkflow')
const { LOW_STOCK_THRESHOLD } = require('../config/constants')

exports.createOrder = async (req, res) => {

  const connection = await db.getConnection()

  try {

    const { table_id, notes, items, payment_method, promo_code, payment_type, loyalty_points_redeemed, redeemed_reward_id } = req.body

    const customer_id = req.user.role === 'customer' ? req.user.id : null

    if (!table_id || !Array.isArray(items) || (items.length === 0 && !redeemed_reward_id)) {

      connection.release()

      return res.status(400).json({

        success: false,

        message: 'table_id and items are required'

      })

    }

    await connection.beginTransaction()

    const [tableRows] = await connection.query(

      'SELECT * FROM restaurant_tables WHERE id = ? LIMIT 1 FOR UPDATE',

      [table_id]

    )

    if (!tableRows.length) {

      await connection.rollback()

      connection.release()

      return res.status(404).json({

        success: false,

        message: 'Table not found'

      })

    }

    const [sessionRows] = await connection.query(

      `SELECT * FROM table_sessions WHERE table_id = ? AND status = 'active' LIMIT 1`,

      [table_id]

    )

    let sessionId = null

    if (sessionRows.length) {

      sessionId = sessionRows[0].id

    } else {

      const token = require('crypto').randomBytes(32).toString('hex')

      const [sessionResult] = await connection.query(

        `INSERT INTO table_sessions (table_id, session_token, status) VALUES (?, ?, 'active')`,

        [table_id, token]

      )

      sessionId = sessionResult.insertId

    }

    // Include reward stock in the same ordered lock set as purchased items.
    if (customer_id && (redeemed_reward_id || loyalty_points_redeemed)) {
      await connection.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [customer_id])
    }
    let rewardItemId = null
    if (redeemed_reward_id) {
      const [[reward]] = await connection.query(
        'SELECT * FROM loyalty_rewards WHERE id = ? AND is_active = TRUE FOR UPDATE',
        [Number(redeemed_reward_id)]
      )
      rewardItemId = reward?.menu_item_id || null
    }
    const demand = new Map()
    for (const item of items) demand.set(item.menu_item_id, (demand.get(item.menu_item_id) || 0) + item.quantity)
    if (rewardItemId) demand.set(rewardItemId, (demand.get(rewardItemId) || 0) + 1)
    const menuItemIds = [...demand.keys()].sort((a, b) => a - b)

    const placeholders = menuItemIds.map(() => '?').join(',')

    const [menuRows] = menuItemIds.length

      ? await connection.query(

          `SELECT id, name, price, is_available, stock_quantity FROM menu_items WHERE id IN (${placeholders}) ORDER BY id FOR UPDATE`,

          menuItemIds

        )

      : [[]]

    const [modifierRows] = menuItemIds.length

      ? await connection.query(

          `SELECT * FROM menu_item_modifiers WHERE menu_item_id IN (${placeholders})`,

          menuItemIds

        )

      : [[]]

    for (const [id, quantity] of demand) {
      const found = menuRows.find(row => row.id === id)
      if (!found || !found.is_available || (found.stock_quantity >= 0 && found.stock_quantity < quantity)) {
        await connection.rollback()
        connection.release()
        return res.status(400).json({ success: false, message: 'Item ' + id + ' is unavailable or has insufficient stock' })
      }
    }
    const itemModifiers = new Map()

    let total = 0

    for (const item of items) {

      const found = menuRows.find(row => row.id === item.menu_item_id)

      if (!found) {

        await connection.rollback()

        connection.release()

        return res.status(400).json({

          success: false,

          message: `Menu item ${item.menu_item_id} not found`

        })

      }

      if (!found.is_available) {

        await connection.rollback()

        connection.release()

        return res.status(400).json({

          success: false,

          message: `Menu item ${item.menu_item_id} is not available`

        })

      }

      if (found.stock_quantity >= 0 && found.stock_quantity < item.quantity) {

        await connection.rollback()

        connection.release()

        return res.status(400).json({

          success: false,

          message: `Not enough stock for item ${item.menu_item_id} (available: ${found.stock_quantity})`

        })

      }

      const requestedModifierIds = Array.isArray(item.modifiers) ? item.modifiers.map(m => Number(m?.id ?? m)) : []

      const selectedModifiers = modifierRows.filter(m => m.menu_item_id === item.menu_item_id && requestedModifierIds.includes(m.id))

      const modifierTotal = selectedModifiers.reduce((sum, m) => sum + Number(m.price_delta), 0)

      itemModifiers.set(item, { selectedModifiers, modifierTotal })

      total += (Number(found.price) + modifierTotal) * Number(item.quantity)

    }

    let promoId = null

    let discountAmount = 0

    if (promo_code) {

      const [promos] = await connection.query(

        'SELECT * FROM promo_codes WHERE code = ? AND is_active = TRUE LIMIT 1',

        [promo_code.toUpperCase()]

      )

      if (promos.length) {

        const promo = promos[0]

        const valid = (!promo.expires_at || new Date(promo.expires_at) >= new Date()) &&

                      (promo.max_uses === 0 || promo.used_count < promo.max_uses) &&

                      total >= Number(promo.min_order)

        if (valid) {

          promoId = promo.id

          if (promo.discount_type === 'percent') {

            discountAmount = total * Number(promo.discount_value) / 100

          } else {

            discountAmount = Math.min(Number(promo.discount_value), total)

          }

          discountAmount = Math.round(discountAmount * 100) / 100

          total = Math.round((total - discountAmount) * 100) / 100

        }

      }

    }

    let rewardRedemption = null

    if (redeemed_reward_id) {

      const { validateRewardRedemption } = require('./loyaltyController')

      rewardRedemption = await validateRewardRedemption(connection, {

        user_id: customer_id || null,

        session_id: sessionId,

        rewardId: Number(redeemed_reward_id)

      })

      if (!rewardRedemption) {

        await connection.rollback()

        connection.release()

        return res.status(400).json({

          success: false,

          message: 'This loyalty reward is not available or you do not have enough points'

        })

      }

    }

    let loyaltyPointsUsed = 0

    let loyaltyDiscount = 0

    if (loyalty_points_redeemed && Number(loyalty_points_redeemed) > 0) {

      const { calculateRedemption } = require('./loyaltyController')

      const redemption = await calculateRedemption(connection, {

        user_id: customer_id || null,

        session_id: sessionId,

        requestedPoints: Number(loyalty_points_redeemed),

        orderTotal: total,

        reservedPoints: rewardRedemption ? rewardRedemption.reward.points_cost : 0

      })

      loyaltyPointsUsed = redemption.pointsUsed

      loyaltyDiscount = redemption.discount

      if (loyaltyDiscount > 0) {

        total = Math.round((total - loyaltyDiscount) * 100) / 100

        discountAmount = Math.round((discountAmount + loyaltyDiscount) * 100) / 100

      }

    }

    const [orderResult] = await connection.query(

      `INSERT INTO orders (table_id, session_id, customer_id, status, total, notes, promo_code_id, discount_amount, payment_type) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,

      [table_id, sessionId, customer_id || null, total, notes || null, promoId, discountAmount, payment_type || 'online']

    )

    const orderId = orderResult.insertId

    if (loyaltyPointsUsed > 0) {

      const { recordRedemption } = require('./loyaltyController')

      await recordRedemption(connection, {

        user_id: customer_id || null,

        session_id: sessionId,

        orderId,

        pointsUsed: loyaltyPointsUsed,

        discount: loyaltyDiscount

      })

    }

    if (rewardRedemption) {

      await connection.query(

        'INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes, modifiers, modifier_total) VALUES (?, ?, 1, 0, ?, NULL, 0)',

        [orderId, rewardRedemption.item.id, `Loyalty reward: ${rewardRedemption.reward.name}`]

      )

      const { recordRewardRedemption } = require('./loyaltyController')

      await recordRewardRedemption(connection, {

        user_id: customer_id || null,

        session_id: sessionId,

        orderId,

        reward: rewardRedemption.reward

      })

    }

    const lowStockAlerts = []

    for (const item of items) {

      const found = menuRows.find(row => row.id === item.menu_item_id)

      const { selectedModifiers, modifierTotal } = itemModifiers.get(item)

      await connection.query(

        'INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes, modifiers, modifier_total) VALUES (?, ?, ?, ?, ?, ?, ?)',

        [orderId, item.menu_item_id, item.quantity, found.price, item.notes || null, selectedModifiers.length ? JSON.stringify(selectedModifiers.map(m => ({ id: m.id, name: m.name, price_delta: Number(m.price_delta) }))) : null, modifierTotal]

      )

    }

    // Reserve aggregate demand once, while all item locks are held.
    for (const [id, quantity] of demand) {
      const found = menuRows.find(row => row.id === id)
      if (found.stock_quantity < 0) continue
      await connection.query('UPDATE menu_items SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, id])
      const newStock = found.stock_quantity - quantity
      if (newStock === 0 || (newStock <= LOW_STOCK_THRESHOLD && found.stock_quantity > LOW_STOCK_THRESHOLD)) {
        lowStockAlerts.push({ menu_item_id: id, name: found.name, stock_quantity: newStock, level: newStock === 0 ? 'out' : 'low' })
      }
    }

    await connection.query(

      `INSERT INTO payments (order_id, amount, method, payment_timing, status) VALUES (?, ?, ?, ?, 'pending')`,

      [orderId, total, payment_method || 'card', payment_type === 'physical' ? 'post' : 'pre']

    )

    await connection.query(

      'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',

      [orderId, 'pending']

    )

    await connection.query(

      `UPDATE restaurant_tables SET status = 'occupied' WHERE id = ?`,

      [table_id]

    )

    await connection.commit()

    connection.release()

    if (promoId) {

      try {

        await db.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [promoId])

      } catch { }

    }

    try {

      const { getIO } = require('../socket')

      const io = getIO()

      if (io) {

        io.to('kitchen').emit('new-order', { order_id: orderId, table_number: tableRows[0].table_number })

        io.to('waiter').emit('new-order', { order_id: orderId, table_number: tableRows[0].table_number })

        for (const alert of lowStockAlerts) {

          io.to('manager').to('admin').emit('low-stock-alert', alert)

        }

      }

    } catch { }



    res.status(201).json({

      success: true,

      message: 'Order created successfully',

      data: {

        order_id: orderId,

        total,

        discount: discountAmount,

        loyalty_points_used: loyaltyPointsUsed,

        loyalty_discount: loyaltyDiscount,

        redeemed_reward: rewardRedemption ? { name: rewardRedemption.reward.name, points_cost: rewardRedemption.reward.points_cost, item_name: rewardRedemption.item.name } : null

      }

    })

  } catch (error) {

    await connection.rollback()

    connection.release()

    res.status(500).json({

      success: false,

      message: 'Failed to create order',

      error: error.message

    })

  }

}

exports.getOrderById = async (req, res) => {

  try {

    const { id } = req.params

    const [orders] = await db.query(

      `SELECT 

        orders.*,

        restaurant_tables.table_number

      FROM orders

      LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id

      WHERE orders.id = ?`,

      [id]

    )

    if (!orders.length) {

      return res.status(404).json({

        success: false,

        message: 'Order not found'

      })

    }

    const [items] = await db.query(

      `SELECT

        order_items.id,

        order_items.quantity,

        order_items.price,

        order_items.notes,

        order_items.status,

        order_items.modifiers,

        order_items.modifier_total,

        menu_items.name

      FROM order_items

      LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id

      WHERE order_items.order_id = ?`,

      [id]

    )

    for (const item of items) {

      if (item.modifiers) {

        try { item.modifiers = JSON.parse(item.modifiers) } catch { item.modifiers = [] }

      } else {

        item.modifiers = []

      }

    }

    const [payment] = await db.query(

      'SELECT * FROM payments WHERE order_id = ? LIMIT 1',

      [id]

    )

    const [history] = await db.query(

      'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC',

      [id]

    )

    res.json({

      success: true,

      data: {

        order: orders[0],

        items,

        payment: payment[0] || null,

        history

      }

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Failed to fetch order',

      error: error.message

    })

  }

}

exports.updateOrderStatus = async (req, res) => {

  try {

    const { id } = req.params

    const { status } = req.body

    if (status === 'cancelled' && ['admin', 'manager', 'waiter'].includes(req.user.role)) return exports.cancelOrder(req, res)
    await transitionOrderStatus(id, status, { role: req.user.role })

    res.json({

      success: true,

      message: 'Order status updated successfully'

    })

  } catch (error) {

    res.status(error.statusCode || 500).json({

      success: false,

      message: error.statusCode ? error.message : 'Failed to update order status',

      error: error.message

    })

  }

}

exports.cancelOrder = async (req, res) => {

  const connection = await db.getConnection()
  let committed = false
  try {
    await connection.beginTransaction()

    const { id } = req.params

    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id])

    if (!orders.length) {

      return res.status(404).json({ success: false, message: 'Order not found' })

    }

    if (!['pending', 'confirmed'].includes(orders[0].status)) {

      return res.status(400).json({

        success: false,

        message: 'Can only cancel orders that are pending or confirmed'

      })

    }

    const [[settled]] = await connection.query("SELECT COUNT(*) AS count FROM payments WHERE order_id = ? AND status = 'paid'", [id])
    if (Number(settled.count) > 0) return res.status(409).json({ success: false, message: 'Ask staff to refund collected payments before cancelling' })
    const [orderItems] = await connection.query(

      'SELECT menu_item_id, quantity FROM order_items WHERE order_id = ? ORDER BY menu_item_id', [id]

    )

    for (const oi of orderItems) {

      await connection.query(

        'UPDATE menu_items SET stock_quantity = stock_quantity + ? WHERE id = ? AND stock_quantity >= 0',

        [oi.quantity, oi.menu_item_id]

      )

    }

    const order = orders[0]

    if (order.promo_code_id) {

      await connection.query(

        'UPDATE promo_codes SET used_count = GREATEST(used_count - 1, 0) WHERE id = ?',

        [order.promo_code_id]

      )

    }

    await connection.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [id])

    await connection.query(

      'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',

      [id, 'cancelled']

    )

    await connection.query(

      `UPDATE payments SET status = 'failed' WHERE order_id = ? AND status = 'pending'`,

      [id]

    )

    await connection.query("DELETE FROM loyalty_points WHERE order_id = ?", [id])
    await connection.commit()
    committed = true
    await require('../services/orderWorkflow').emitOrderStatus(id, 'cancelled')
    res.json({ success: true, message: 'Order cancelled successfully' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  } finally {
    if (!committed) await connection.rollback()
    connection.release()
  }
}

exports.rateOrder = async (req, res) => {

  try {

    const { id } = req.params

    const { rating, comment } = req.body

    if (!rating || rating < 1 || rating > 5) {

      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })

    }

    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id])

    if (!orders.length) {

      return res.status(404).json({ success: false, message: 'Order not found' })

    }

    if (!['served', 'completed'].includes(orders[0].status)) {

      return res.status(400).json({ success: false, message: 'Can only rate served or completed orders' })

    }

    const [existing] = await db.query('SELECT * FROM ratings WHERE order_id = ?', [id])

    if (existing.length) {

      return res.status(400).json({ success: false, message: 'Order already rated' })

    }

    await db.query(

      'INSERT INTO ratings (order_id, rating, comment) VALUES (?, ?, ?)',

      [id, rating, comment || null]

    )

    res.status(201).json({ success: true, message: 'Rating submitted' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getOrderRating = async (req, res) => {

  try {

    const { id } = req.params

    const [rows] = await db.query('SELECT * FROM ratings WHERE order_id = ?', [id])

    res.json({ success: true, data: rows[0] || null })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getOrdersBySession = async (req, res) => {

  try {

    const { session_id } = req.params

    const [orders] = await db.query(

      `SELECT orders.*, restaurant_tables.table_number

       FROM orders

       LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id

       WHERE orders.session_id = ?

       ORDER BY orders.created_at DESC`,

      [session_id]

    )

    for (const order of orders) {

      const [items] = await db.query(

        `SELECT order_items.*, menu_items.name

         FROM order_items

         LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id

         WHERE order_items.order_id = ?`,

        [order.id]

      )

      order.items = items

    }

    res.json({ success: true, data: orders })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getOrdersByTable = async (req, res) => {

  try {

    const { table_id } = req.params

    const [orders] = await db.query(

      `SELECT orders.*, restaurant_tables.table_number

       FROM orders

       LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id

       WHERE orders.table_id = ? AND orders.session_id IN (

         SELECT id FROM table_sessions WHERE table_id = ? AND status = 'active'

       )

       ORDER BY orders.created_at DESC`,

      [table_id, table_id]

    )

    for (const order of orders) {

      const [items] = await db.query(

        `SELECT order_items.*, menu_items.name

         FROM order_items

         LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id

         WHERE order_items.order_id = ?`,

        [order.id]

      )

      order.items = items

    }

    res.json({ success: true, data: orders })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getMyOrders = async (req, res) => {

  try {

    const userId = req.user.id

    const [orders] = await db.query(

      `SELECT orders.*, restaurant_tables.table_number

       FROM orders

       LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id

       WHERE orders.customer_id = ?

       ORDER BY orders.created_at DESC`,

      [userId]

    )

    for (const order of orders) {

      const [items] = await db.query(

        `SELECT order_items.*, menu_items.name

         FROM order_items

         LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id

         WHERE order_items.order_id = ?`,

        [order.id]

      )

      order.items = items

    }

    res.json({ success: true, data: orders })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}
