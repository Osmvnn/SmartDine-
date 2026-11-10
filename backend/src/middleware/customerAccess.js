const db = require('../config/db')
const { tableAccess } = require('./resourceAccess')
const forbidden = res => res.status(403).json({ success: false, message: 'Scan your table QR code to continue' })

async function customerTableAccess(req, res, next) {
  if (req.user.role !== 'customer') return tableAccess(req => req.body.table_id)(req, res, next)
  const token = req.header('X-Table-Token')
  if (!token) return forbidden(res)
  const [[table]] = await db.query('SELECT id FROM restaurant_tables WHERE id = ? AND qr_token = ?', [req.body.table_id, token])
  if (!table) return forbidden(res)
  next()
}

async function createOrderAccess(req, res, next) {
  const { items, redeemed_reward_id } = req.body
  if (!Array.isArray(items) || (!items.length && !redeemed_reward_id) ||
      items.some(item => !item || !Number.isSafeInteger(item.menu_item_id) || item.menu_item_id <= 0 ||
        !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 1000)) {
    return res.status(400).json({ success: false, message: 'Items require valid IDs and positive integer quantities (maximum 1000)' })
  }
  if (req.user.role !== 'customer' && (req.body.loyalty_points_redeemed || redeemed_reward_id)) {
    return res.status(400).json({ success: false, message: 'Rewards require a customer account' })
  }
  return customerTableAccess(req, res, next)
}

async function customerDoneAccess(req, res, next) {
  const [[table]] = await db.query('SELECT id FROM restaurant_tables WHERE qr_token = ?', [req.params.qrToken])
  if (!table) return forbidden(res)
  if (req.user.role !== 'customer') return tableAccess(() => table.id)(req, res, next)
  const [[membership]] = await db.query(
    `SELECT o.id FROM orders o JOIN table_sessions s ON s.id = o.session_id
     WHERE s.table_id = ? AND s.status = 'active' AND o.customer_id = ? LIMIT 1`, [table.id, req.user.id]
  )
  if (!membership) return forbidden(res)
  next()
}
module.exports = { customerTableAccess, createOrderAccess, customerDoneAccess }
