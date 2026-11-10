const db = require('../config/db')
const { emitOrderStatus, transitionOrderStatus } = require('../services/orderWorkflow')

const REFUND_REASONS = ['customer_complaint', 'order_cancelled', 'duplicate_charge', 'food_quality_issue', 'incorrect_order', 'other']

const { configurePayment } = require('../services/configurePayment')
const { demoPaymentsEnabled } = require('../services/paymentPolicy')
exports.getCapabilities = (req, res) => res.json({ success: true, data: { online: demoPaymentsEnabled(), demo: demoPaymentsEnabled() } })
exports.processPayment = async (req, res) => {
  try {
    const result = await configurePayment(req.body.order_id, req.body)
    res.json({ success: true, data: { ...result.transactions[0], demo: result.demo } })
  } catch (error) { res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Unable to arrange payment' }) }
}
exports.splitPayment = async (req, res) => {
  try {
    const result = await configurePayment(req.body.order_id, req.body, true)
    res.json({ success: true, data: result })
  } catch (error) { res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Unable to arrange split payment' }) }
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
        `SELECT payer_name, amount, method, payment_timing FROM payments WHERE order_id = ? AND status = 'paid'`,
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
    await require('../services/settlePayment').settlePayment(req.params.payment_id, req.accessibleOrder.id, req.user)
    res.json({ success: true, message: req.user.role === 'waiter' ? 'Collection recorded; awaiting cashier verification' : 'Payment confirmed' })
  } catch (error) { res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Unable to confirm payment' }) }
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
    const { reason, notes } = req.body
    if (!REFUND_REASONS.includes(reason)) return res.status(400).json({ success: false, message: 'A valid refund reason is required' })
    const fullReason = (notes ? reason + ': ' + String(notes) : reason).slice(0, 255)
    await require('../services/settlePayment').recordRefund(req.params.payment_id, req.accessibleOrder.id, req.user.id, fullReason)
    res.json({ success: true, message: 'Refund recorded; this does not transfer money' })
  } catch (error) { res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Unable to record refund' }) }
}

exports.notifyCashPayment = async (req, res) => {

  try {

    const { order_id, method } = req.body
    const table_id = req.accessibleOrder.table_id

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
