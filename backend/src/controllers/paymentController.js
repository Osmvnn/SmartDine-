const db = require('../config/db')
const { emitOrderStatus, transitionOrderStatus } = require('../services/orderWorkflow')

const REFUND_REASONS = ['customer_complaint', 'order_cancelled', 'duplicate_charge', 'food_quality_issue', 'incorrect_order', 'other']

exports.processPayment = async (req, res) => {

  try {

    const { order_id, method, split_type, payer_name, payment_timing, status, tip } = req.body

    if (!order_id) {

      return res.status(400).json({ success: false, message: 'order_id is required' })

    }

    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [order_id])

    if (!orders.length) {

      return res.status(404).json({ success: false, message: 'Order not found' })

    }

    const order = orders[0]
    const isNoChargeOrder = Number(order.total || 0) <= 0
    const timing = isNoChargeOrder ? 'pre' : (payment_timing || 'pre')
    const tipAmount = !isNoChargeOrder && timing === 'pre' ? Math.max(0, Number(tip || 0)) : 0
    let payerName = payer_name || null

    if (!payerName && order.customer_id) {
      const [users] = await db.query('SELECT name FROM users WHERE id = ? LIMIT 1', [order.customer_id])
      payerName = users[0]?.name || null
    }

    if (['cancelled', 'completed'].includes(order.status)) {

      return res.status(400).json({ success: false, message: `Cannot process payment for a ${order.status} order` })

    }

    if (timing === 'pre') {
      const [existingPayment] = await db.query(

        'SELECT * FROM payments WHERE order_id = ? AND status = "paid"', [order_id]

      )

      if (existingPayment.length) {

        return res.status(400).json({ success: false, message: 'Order is already paid' })

      }
    }

    const transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase()

    const [existing] = await db.query('SELECT id FROM payments WHERE order_id = ?', [order_id])

    const finalStatus = timing === 'pre' ? (status || 'paid') : 'pending'
    const paymentAmount = Math.round((Number(order.total) + tipAmount) * 100) / 100

    if (existing.length) {

      await db.query(

        'UPDATE payments SET amount = ?, status = ?, method = ?, transaction_id = ?, split_type = ?, payer_name = ?, payment_timing = ?, tip_amount = ? WHERE order_id = ?',

        [paymentAmount, finalStatus, method || 'card', transactionId, split_type || 'full', payerName, timing, tipAmount, order_id]

      )

    } else {

      await db.query(

        'INSERT INTO payments (order_id, amount, method, status, transaction_id, split_type, payer_name, payment_timing, tip_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',

        [order_id, paymentAmount, method || 'card', finalStatus, transactionId, split_type || 'full', payerName, timing, tipAmount]

      )

    }

    if (timing === 'pre') {
      if (order.status === 'pending') {

        await transitionOrderStatus(order_id, 'confirmed', { role: 'admin' })

      }

      try {

        const { getIO } = require('../socket')

        const io = getIO()

        if (io) {

          io.to('kitchen').emit('order-paid', { order_id, table_number: null })

        }

      } catch { }
    } else {
      if (order.status === 'pending') {

        await transitionOrderStatus(order_id, 'confirmed', { role: 'admin' })

      }

      try {

        const { getIO } = require('../socket')

        const io = getIO()

        if (io) {

          io.to('kitchen').emit('order-paid', { order_id, table_number: null })

          io.to('cashier').emit('pending-payment', { order_id, method, table_id: order.table_id })

          io.to('waiter').emit('pending-payment', { order_id, method, table_id: order.table_id })

        }

      } catch { }
    }

    res.json({

      success: true,

      message: 'Payment processed successfully',

      data: { transaction_id: transactionId, status: finalStatus, amount: paymentAmount, tip: tipAmount }

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.splitPayment = async (req, res) => {

  try {

    const { order_id, splits } = req.body

    if (!order_id || !splits || !Array.isArray(splits) || splits.length === 0) {

      return res.status(400).json({ success: false, message: 'order_id and splits array are required' })

    }

    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [order_id])

    if (!orders.length) {

      return res.status(404).json({ success: false, message: 'Order not found' })

    }

    const order = orders[0]

    if (['cancelled', 'completed'].includes(order.status)) {

      return res.status(400).json({ success: false, message: `Cannot split payment for a ${order.status} order` })

    }

    const totalSplit = splits.reduce((sum, s) => sum + Number(s.amount), 0)
    const totalTip = splits.reduce((sum, s) => sum + Math.max(0, Number(s.tip || 0)), 0)
    const expectedTotal = Math.round((Number(order.total) + totalTip) * 100) / 100

    if (Math.abs(totalSplit - expectedTotal) > 0.01) {

      return res.status(400).json({

        success: false,

        message: `Split amounts ($${totalSplit.toFixed(2)}) must equal order total ($${expectedTotal.toFixed(2)})`

      })

    }

    await db.query('DELETE FROM payments WHERE order_id = ? AND status = "pending"', [order_id])

    const transactions = []

    for (const split of splits) {

      const timing = split.payment_timing === 'post' ? 'post' : 'pre'

      const status = timing === 'post' ? 'pending' : 'paid'

      const txnId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase()
      const splitTip = Math.max(0, Number(split.tip || 0))

      await db.query(

        'INSERT INTO payments (order_id, amount, method, status, transaction_id, split_type, payer_name, payment_timing, tip_amount) VALUES (?, ?, ?, ?, ?, "custom", ?, ?, ?)',

        [order_id, split.amount, split.method || 'card', status, txnId, split.payer_name || null, timing, splitTip]

      )

      transactions.push({
        payer: split.payer_name,
        amount: split.amount,
        method: split.method || 'card',
        payment_timing: timing,
        status,
        transaction_id: txnId
      })

    }

    if (order.status === 'pending') {

      await transitionOrderStatus(order_id, 'confirmed', { role: 'admin' })

    }

    try {

      const { getIO } = require('../socket')

      const io = getIO()

      if (io) {

        io.to('kitchen').emit('order-paid', { order_id })

        const pendingSplits = transactions.filter(t => t.status === 'pending')

        if (pendingSplits.length) {

          io.to('cashier').emit('pending-payment', { order_id, table_id: order.table_id, splits: pendingSplits })

          io.to('waiter').emit('pending-payment', { order_id, table_id: order.table_id, splits: pendingSplits })

        }

      }

    } catch { }

    res.json({ success: true, message: 'Split payment processed', data: { transactions } })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getPaymentByOrder = async (req, res) => {

  try {

    const { orderId } = req.params

    const [payments] = await db.query(

      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',

      [orderId]

    )

    if (!payments.length) {

      return res.status(404).json({ success: false, message: 'Payment not found' })

    }

    res.json({ success: true, data: payments.length === 1 ? payments[0] : payments })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getPendingPayments = async (req, res) => {

  try {

    const role = req.user?.role
    const userId = req.user?.id
    const waiterFilter = role === 'waiter' ? 'AND p.waiter_confirmed_by IS NULL AND rt.waiter_id = ?' : ''
    const params = role === 'waiter' ? [userId] : []

    const [payments] = await db.query(`

      SELECT

        p.*,

        o.table_id,
        o.status AS order_status,
        o.created_at AS order_created_at,
        o.total AS order_total,
        o.discount_amount,

        rt.table_number,

        u.name AS waiter_confirmed_name,

        SUM(oi.quantity) as item_count

      FROM payments p

      JOIN orders o ON p.order_id = o.id

      JOIN restaurant_tables rt ON o.table_id = rt.id

      LEFT JOIN order_items oi ON o.id = oi.order_id

      LEFT JOIN users u ON u.id = p.waiter_confirmed_by

      WHERE p.status = 'pending' AND p.payment_timing = 'post' ${waiterFilter}

      GROUP BY p.id

      ORDER BY (p.waiter_confirmed_by IS NOT NULL) DESC, p.created_at DESC

    `, params)

    for (const payment of payments) {

      const [items] = await db.query(`
        SELECT order_items.quantity, order_items.price, menu_items.name
        FROM order_items
        LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id
        WHERE order_items.order_id = ?
      `, [payment.order_id])

      payment.items = items

      const [paidSplits] = await db.query(
        'SELECT payer_name, amount, method, payment_timing FROM payments WHERE order_id = ? AND status = "paid"',
        [payment.order_id]
      )

      payment.paidSplits = paidSplits

    }

    res.json({ success: true, data: payments })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.confirmCashPayment = async (req, res) => {

  try {

    const { payment_id } = req.params

    const userId = req.user ? req.user.id : null
    const role = req.user?.role

    const [payments] = await db.query(

      'SELECT * FROM payments WHERE id = ? LIMIT 1',

      [payment_id]

    )

    if (!payments.length) {

      return res.status(404).json({ success: false, message: 'Payment not found' })

    }

    const payment = payments[0]

    const [orders] = await db.query(

      'SELECT * FROM orders WHERE id = ? LIMIT 1',

      [payment.order_id]

    )

    if (!orders.length) {

      return res.status(404).json({ success: false, message: 'Order not found' })

    }

    const order = orders[0]

    if (order.status === 'cancelled') {

      return res.status(400).json({ success: false, message: 'Cannot confirm payment for a cancelled order' })

    }
    if (role === 'waiter') {

      if (payment.waiter_confirmed_by) {
        return res.status(400).json({ success: false, message: 'Already confirmed, awaiting cashier verification' })
      }

      await db.query(
        'UPDATE payments SET waiter_confirmed_by = ?, waiter_confirmed_at = NOW() WHERE id = ?',
        [userId, payment_id]
      )

      try {

        const { getIO } = require('../socket')

        const io = getIO()

        if (io) {

          io.to('cashier').emit('payment-confirmed', { order_id: payment.order_id, payment_id, method: payment.method, stage: 'waiter' })

        }

      } catch { }

      return res.json({ success: true, message: 'Payment marked as collected. Awaiting cashier verification.' })
    }
    await db.query(

      'UPDATE payments SET status = "paid", cashier_confirmed = 1, confirmed_by = ?, confirmed_at = NOW() WHERE id = ?',

      [userId, payment_id]

    )

    if (order.status === 'pending') {

      await transitionOrderStatus(payment.order_id, 'confirmed', { role: role || 'cashier' })

    } else if (order.status === 'served') {

      await transitionOrderStatus(payment.order_id, 'completed', { role: role || 'cashier' })

    } else if (order.status === 'completed') {

      emitOrderStatus(payment.order_id, 'completed')

    }

    try {

      const { getIO } = require('../socket')

      const io = getIO()

      if (io) {

        io.emit('payment-confirmed', { order_id: payment.order_id, payment_id, method: payment.method })

      }

    } catch { }

    res.json({ success: true, message: 'Payment confirmed successfully' })

  } catch (error) {

    res.status(error.statusCode || 500).json({ success: false, message: error.message })

  }

}

exports.getRecentPayments = async (req, res) => {

  try {

    const page = Math.max(1, parseInt(req.query.page) || 1)

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

    const offset = (page - 1) * limit

    const statusFilter = req.query.status

    let where = "p.status IN ('paid', 'refunded')"

    const params = []

    if (statusFilter && ['paid', 'refunded'].includes(statusFilter)) {

      where = 'p.status = ?'

      params.push(statusFilter)

    }

    if (req.query.order_id) {

      where += ' AND p.order_id = ?'

      params.push(req.query.order_id)

    }

    if (req.query.table_number) {

      where += ' AND rt.table_number = ?'

      params.push(req.query.table_number)

    }

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
      WHERE ${where}
    `, params)

    const [rows] = await db.query(`

      SELECT p.*, o.table_id, rt.table_number, ru.name as refunded_by_name

      FROM payments p

      JOIN orders o ON p.order_id = o.id

      LEFT JOIN restaurant_tables rt ON o.table_id = rt.id

      LEFT JOIN users ru ON ru.id = p.refunded_by

      WHERE ${where}

      ORDER BY p.created_at DESC

      LIMIT ? OFFSET ?

    `, [...params, limit, offset])

    res.json({ success: true, data: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, refundReasons: REFUND_REASONS })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.refundPayment = async (req, res) => {

  try {

    const { payment_id } = req.params

    const { reason, notes } = req.body

    const userId = req.user.id

    if (!reason || !REFUND_REASONS.includes(reason)) {

      return res.status(400).json({ success: false, message: 'A valid refund reason is required' })

    }

    const [payments] = await db.query('SELECT * FROM payments WHERE id = ?', [payment_id])

    if (!payments.length) {

      return res.status(404).json({ success: false, message: 'Payment not found' })

    }

    const payment = payments[0]

    if (payment.status !== 'paid') {

      return res.status(400).json({ success: false, message: `Cannot refund a payment with status "${payment.status}"` })

    }

    const fullReason = (notes ? `${reason}: ${notes}` : reason).slice(0, 255)

    await db.query(

      'UPDATE payments SET status = "refunded", refund_reason = ?, refunded_by = ?, refunded_at = NOW() WHERE id = ?',

      [fullReason, userId, payment_id]

    )

    try {

      const { getIO } = require('../socket')

      const io = getIO()

      if (io) {

        io.emit('payment-refunded', { order_id: payment.order_id, payment_id: Number(payment_id) })

      }

    } catch { }

    res.json({ success: true, message: 'Payment refunded successfully' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.notifyCashPayment = async (req, res) => {

  try {

    const { order_id, table_id, method } = req.body

    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [order_id])

    if (!orders.length) {

      return res.status(404).json({ success: false, message: 'Order not found' })

    }

    const [tables] = await db.query('SELECT * FROM restaurant_tables WHERE id = ?', [table_id])

    const table = tables[0]

    try {

      const { getIO } = require('../socket')

      const io = getIO()

      if (io) {

        const payload = {

          order_id,

          table_id,

          table_number: table ? table.table_number : 'N/A',

          total: orders[0].total,

          method: method || 'cash',

          message: `Payment will be collected from Table #${table ? table.table_number : 'N/A'}`

        }

        io.to('cashier').emit('cash-payment-pending', payload)

        io.to('waiter').emit('pending-payment', payload)

      }

    } catch { }

    res.json({ success: true, message: 'Notification sent' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}
