const db = require('../config/db')
const { transitionOrderStatus, emitOrderStatus } = require('./orderWorkflow')
const fail = message => { throw Object.assign(new Error(message), { statusCode: 409 }) }

async function awardSettledPoints(connection, order) {
  if (!order.customer_id || Number(order.total) <= 0) return
  const [[balance]] = await connection.query(
    "SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN amount - tip_amount ELSE 0 END), 0) AS paid, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending FROM payments WHERE order_id = ?", [order.id])
  if (Number(balance.pending) > 0 || Math.round(Number(balance.paid) * 100) < Math.round(Number(order.total) * 100)) return
  await connection.query(
    `INSERT INTO loyalty_points (session_id, user_id, points, type, order_id, description)
     SELECT ?, ?, ?, 'earned', ?, ? WHERE NOT EXISTS
     (SELECT 1 FROM loyalty_points WHERE order_id = ? AND type = 'earned')`,
    [order.session_id, order.customer_id, Math.floor(Number(order.total) * 10), order.id, `Earned from settled order #${order.id}`, order.id]
  )
}

async function settlePayment(paymentId, orderId, user) {
  const connection = await db.getConnection()
  let status
  let payment
  try {
    await connection.beginTransaction()
    const [[order]] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId])
    ;[[payment]] = await connection.query('SELECT * FROM payments WHERE id = ? AND order_id = ? FOR UPDATE', [paymentId, orderId])
    if (!order || !payment || order.status === 'cancelled') fail('Payment is no longer collectable')
    if (payment.status !== 'pending' || payment.payment_timing !== 'post') fail('Only pending pay-later collections can be confirmed by staff')
    if (user.role === 'waiter') {
      const [[table]] = await connection.query('SELECT waiter_id FROM restaurant_tables WHERE id = ?', [order.table_id])
      if (Number(table?.waiter_id) !== user.id) fail('Table assignment has changed')
      if (payment.waiter_confirmed_by) fail('Already collected; awaiting cashier verification')
      await connection.query('UPDATE payments SET waiter_confirmed_by = ?, waiter_confirmed_at = NOW() WHERE id = ?', [user.id, paymentId])
    } else {
      await connection.query("UPDATE payments SET status = 'paid', cashier_confirmed = TRUE, confirmed_by = ?, confirmed_at = NOW() WHERE id = ?", [user.id, paymentId])
      const [[balance]] = await connection.query(
        "SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN amount - tip_amount ELSE 0 END), 0) AS paid, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending FROM payments WHERE order_id = ?", [orderId])
      if (order.status === 'pending') status = 'confirmed'
      if (order.status === 'served' && Number(balance.pending) === 0 && Math.round(Number(balance.paid) * 100) >= Math.round(Number(order.total) * 100)) status = 'completed'
      if (status) await transitionOrderStatus(orderId, status, { role: 'admin', connection, emit: false })
      await awardSettledPoints(connection, order)
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally { connection.release() }
  if (status) await emitOrderStatus(orderId, status)
  try {
    await require('../socket').emitOrderEvent(orderId, 'payment-confirmed', { order_id: orderId, payment_id: Number(paymentId), method: payment.method, stage: user.role === 'waiter' ? 'waiter' : 'cashier' })
  } catch { /* Settlement is committed even when notifications are unavailable. */ }
}
async function recordRefund(paymentId, orderId, userId, reason) {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()
    await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId])
    const [[payment]] = await connection.query('SELECT * FROM payments WHERE id = ? AND order_id = ? FOR UPDATE', [paymentId, orderId])
    if (!payment || payment.status !== 'paid') fail('Only paid payments can be refunded')
    if (payment.payment_timing !== 'post' && !String(payment.transaction_id || '').startsWith('DEMO_') && Number(payment.amount) > 0) {
      fail('Online refunds require provider verification; only staff-returned funds or demo refunds can be recorded here')
    }
    await connection.query("UPDATE payments SET status = 'refunded', refund_reason = ?, refunded_by = ?, refunded_at = NOW() WHERE id = ?", [reason, userId, paymentId])
    // A refunded order is no longer fully settled and must not retain earned rewards.
    await connection.query("DELETE FROM loyalty_points WHERE order_id = ? AND type = 'earned'", [orderId])
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally { connection.release() }
  try { await require('../socket').emitOrderEvent(orderId, 'payment-refunded', { order_id: orderId, payment_id: Number(paymentId) }) } catch { }
}
module.exports = { settlePayment, awardSettledPoints, recordRefund }
