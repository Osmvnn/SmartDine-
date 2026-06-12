const db = require('../config/db')
const { getClientIp, logSecurityEvent } = require('../services/securityLog')

const checkBlockedIp = async (req, res, next) => {
  try {
    const ip = getClientIp(req)
    const [rows] = await db.query('SELECT id FROM blocked_ips WHERE ip_address = ? LIMIT 1', [ip])
    if (rows.length) {
      logSecurityEvent('blocked_ip_attempt', req, { details: { ip } })
      return res.status(403).json({ success: false, message: 'Access denied. Your IP address has been blocked.' })
    }
    next()
  } catch (err) {
    next()
  }
}

module.exports = { checkBlockedIp }
