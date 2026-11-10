const db = require('../config/db')
const { dateText, daysBeforeToday } = require('../config/reportSql')
const { transitionOrderStatus, transitionOrderItemStatus } = require('../services/orderWorkflow')

exports.getKitchenOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT orders.*, restaurant_tables.table_number
      FROM orders
      LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id
      WHERE orders.status IN ('confirmed', 'preparing', 'ready')
      ORDER BY
        CASE orders.status WHEN 'confirmed' THEN 1 WHEN 'preparing' THEN 2 WHEN 'ready' THEN 3 END,
        orders.created_at ASC
    `)

    for (const order of orders) {
      const [items] = await db.query(`
        SELECT order_items.*, menu_items.name
        FROM order_items
        LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id
        WHERE order_items.order_id = ?
      `, [order.id])

      for (const item of items) {
        if (item.modifiers) {
          try { item.modifiers = JSON.parse(item.modifiers) } catch { item.modifiers = [] }
        } else {
          item.modifiers = []
        }
      }

      order.items = items
    }

    res.json({ success: true, data: orders })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getOrdersHistory = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 14, 1), 60)

    const [rows] = await db.query(`
      SELECT
        ${dateText('created_at')} as date,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at >= ${daysBeforeToday}
      GROUP BY ${dateText('created_at')}
      ORDER BY date DESC
    `, [days])

    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getOrdersByDate = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const date = req.query.date

    const conditions = []
    const params = []

    if (date) {
      conditions.push('DATE(orders.created_at) = ?')
      params.push(date)
    }

    const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM orders${whereClause}`, params)

    const [orders] = await db.query(
      `SELECT orders.*, restaurant_tables.table_number
       FROM orders
       LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id
       ${whereClause}
       ORDER BY orders.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    for (const order of orders) {
      const [items] = await db.query(`
        SELECT order_items.*, menu_items.name
        FROM order_items
        LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id
        WHERE order_items.order_id = ?
      `, [order.id])

      for (const item of items) {
        if (item.modifiers) {
          try { item.modifiers = JSON.parse(item.modifiers) } catch { item.modifiers = [] }
        } else {
          item.modifiers = []
        }
      }

      order.items = items
    }

    res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateKitchenOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    await transitionOrderStatus(id, status, { role: req.user.role })

    res.json({ success: true, message: `Order status updated to ${status}` })
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}

exports.updateOrderItemStatus = async (req, res) => {
  try {
    const { id, itemId } = req.params
    const { status } = req.body

    await transitionOrderItemStatus(id, itemId, status, { role: req.user.role })

    res.json({ success: true, message: `Item status updated to ${status}` })
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}
