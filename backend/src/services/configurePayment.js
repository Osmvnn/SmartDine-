const { randomUUID } = require('crypto')
const db = require('../config/db')
const { paymentStatus, validatePaymentInput, demoPaymentsEnabled } = require('./paymentPolicy')
const { transitionOrderStatus, emitOrderStatus } = require('./orderWorkflow')

const fail = (message, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode }) }

async function configurePayment(orderId, input, split = false) {
  validatePaymentInput(input)
  const connection = await db.getConnection()
  let transactions
  let order
  let confirmed = false
  try {
    await connection.beginTransaction()
    ;[[order]] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId])
    if (!order) fail('Order not found', 404)
    if (order.status !== 'pending') fail('Payment arrangement is already submitted; ask staff for changes', 409)
    const [existing] = await connection.query('SELECT * FROM payments WHERE order_id = ? FOR UPDATE', [orderId])
    if (existing.some(p => p.status !== 'pending' || p.transaction_id || p.waiter_confirmed_by)) fail('Payment arrangement cannot be overwritten', 409)
    const parts = split ? input.splits : [input]
    if (!Array.isArray(parts) || !parts.length || parts.length > 20) fail('Between 1 and 20 payment shares are required')
    let allocated = 0
    let tips = 0
    transactions = parts.map(part => {
      if (!part || typeof part !== 'object') fail('Invalid payment share')
      validatePaymentInput(part)
      const timing = Number(order.total) === 0 ? 'pre' : (part.payment_timing || 'pre')
      const status = paymentStatus(order.total, timing)
      const tip = timing === 'pre' ? Math.round(Number(part.tip || 0) * 100) : 0
      const amount = split ? part.amount : Number(order.total) + tip / 100
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || (Number(order.total) > 0 && amount === 0)) fail('Invalid payment amount')
      const cents = Math.round(amount * 100)
      if (Math.abs(amount * 100 - cents) > 0.000001 || cents < tip) fail('Invalid payment precision or tip')
      allocated += cents
      tips += tip
      return {
        payer: String(part.payer_name || '').slice(0, 100) || null,
        amount: cents / 100, method: part.method || 'card', payment_timing: timing,
        status, tip: tip / 100, transaction_id: `${demoPaymentsEnabled() && timing === 'pre' && Number(order.total) > 0 ? 'DEMO' : 'LOCAL'}_${randomUUID()}`
      }
    })
    if (allocated !== Math.round(Number(order.total) * 100) + tips) fail('Payment shares must equal the order total plus tips')
    await connection.query("DELETE FROM payments WHERE order_id = ? AND status = 'pending'", [orderId])
    for (const part of transactions) {
      await connection.query(
        `INSERT INTO payments (order_id, amount, method, status, transaction_id, split_type, payer_name, payment_timing, tip_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, part.amount, part.method, part.status, part.transaction_id, split ? 'custom' : 'full', part.payer, part.payment_timing, part.tip]
      )
    }
    await connection.query('UPDATE orders SET payment_type = ? WHERE id = ?', [transactions.some(p => p.payment_timing === 'post') ? 'physical' : 'online', orderId])
    await transitionOrderStatus(orderId, 'confirmed', { role: 'admin', connection, emit: false })
    await require('./settlePayment').awardSettledPoints(connection, order)
    confirmed = true
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
  if (confirmed) await emitOrderStatus(orderId, 'confirmed')
  try {
    const { getIO } = require('../socket')
    const io = getIO()
    if (io) {
      io.to('kitchen').emit('order-paid', { order_id: orderId, payment_pending: transactions.some(p => p.status === 'pending') })
      if (transactions.some(p => p.status === 'pending')) io.to('cashier').to('waiter').emit('pending-payment', { order_id: orderId, table_id: order.table_id })
    }
  } catch { /* Payment arrangement is committed; notification failure must not suggest a retry. */ }
  return { transactions, demo: demoPaymentsEnabled() && transactions.some(p => p.transaction_id.startsWith('DEMO_')) }
}
module.exports = { configurePayment }
