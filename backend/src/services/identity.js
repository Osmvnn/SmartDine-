const jwt = require('jsonwebtoken')
const db = require('../config/db')
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured')

async function verifyIdentity(token) {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  if (!Number.isSafeInteger(decoded.id) || !decoded.exp) throw new Error('Invalid identity')
  const [[user]] = await db.query('SELECT id, name, email, role, is_active FROM users WHERE id = ? LIMIT 1', [decoded.id])
  if (!user || !user.is_active || user.role !== decoded.role) throw new Error('Account access changed')
  return { ...user, exp: decoded.exp }
}
module.exports = { verifyIdentity, JWT_SECRET }
