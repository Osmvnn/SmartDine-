const db = require('../config/db')
const staff = ['admin', 'manager', 'cashier', 'kitchen', 'waiter']
const deny = res => res.status(403).json({ success: false, message: 'You do not have access to this resource' })

function canAccessOrder(user, order, roles = staff) {
  if (user.role === 'customer') return Number(order.customer_id) === user.id
  return roles.includes(user.role) && (user.role !== 'waiter' || Number(order.waiter_id) === user.id)
}
function orderAccess(getId, roles = staff) {
  return async (req, res, next) => {
    const id = Number(getId(req))
    if (!Number.isSafeInteger(id) || id <= 0) return deny(res)
    const [[order]] = await db.query('SELECT o.*, t.waiter_id FROM orders o JOIN restaurant_tables t ON t.id = o.table_id WHERE o.id = ?', [id])
    if (!order || !canAccessOrder(req.user, order, roles)) return deny(res)
    req.accessibleOrder = order
    next()
  }
}
async function paymentAccess(req, res, next) {
  const [[payment]] = await db.query('SELECT order_id FROM payments WHERE id = ?', [req.params.payment_id])
  if (!payment) return deny(res)
  return orderAccess(() => payment.order_id, ['admin', 'manager', 'cashier', 'waiter'])(req, res, next)
}
function tableAccess(getId) {
  return async (req, res, next) => {
    const [[table]] = await db.query('SELECT id, waiter_id FROM restaurant_tables WHERE id = ?', [getId(req)])
    if (!table || !staff.includes(req.user.role) || (req.user.role === 'waiter' && Number(table.waiter_id) !== req.user.id)) return deny(res)
    next()
  }
}
async function sessionAccess(req, res, next) {
  const [[session]] = await db.query('SELECT table_id FROM table_sessions WHERE id = ?', [req.params.session_id])
  if (!session) return deny(res)
  return tableAccess(() => session.table_id)(req, res, next)
}
async function requestAccess(req, res, next) {
  const [[request]] = await db.query('SELECT table_id FROM waiter_requests WHERE id = ?', [req.params.id])
  if (!request) return deny(res)
  return tableAccess(() => request.table_id)(req, res, next)
}
module.exports = { orderAccess, paymentAccess, tableAccess, sessionAccess, requestAccess, canAccessOrder }
