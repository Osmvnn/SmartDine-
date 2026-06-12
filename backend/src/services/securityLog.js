const db = require('../config/db')

const MAX_DETAILS_LEN = 255

const getClientIp = (req) => {
  let ip = req.ip || req.socket?.remoteAddress || 'unknown'
  if (ip === '::1') ip = '127.0.0.1'
  else if (ip.startsWith('::ffff:')) ip = ip.slice(7)
  return ip
}

const logSecurityEvent = async (eventType, req, extra = {}) => {
  try {
    const details = extra.details ? JSON.stringify(extra.details).slice(0, MAX_DETAILS_LEN) : null
    await db.query(
      'INSERT INTO security_events (event_type, ip_address, email, user_id, path, method, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        eventType,
        getClientIp(req),
        extra.email || null,
        extra.userId || null,
        req.originalUrl || req.path || null,
        req.method || null,
        details
      ]
    )
  } catch (err) {
    console.error('Security log error:', err.message)
  }
}

module.exports = { logSecurityEvent, getClientIp }
