const db = require('../config/db')
const { getClientIp } = require('../services/securityLog')

const SUSPICIOUS_EVENTS = ['failed_login', 'rate_limited', 'invalid_token', 'forbidden', 'unauthorized']

exports.getSecuritySummary = async (req, res) => {

  try {

    const [[today]] = await db.query(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(event_type = 'failed_login'), 0) as failed_logins,
        COALESCE(SUM(event_type = 'rate_limited'), 0) as rate_limited,
        COALESCE(SUM(event_type IN ('unauthorized', 'forbidden', 'invalid_token')), 0) as unauthorized,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM security_events
      WHERE DATE(created_at) = CURDATE()
    `)

    const [topIps] = await db.query(`
      SELECT
        ip_address,
        COUNT(*) as event_count,
        COALESCE(SUM(event_type = 'failed_login'), 0) as failed_logins,
        MAX(created_at) as last_seen
      FROM security_events
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY ip_address
      ORDER BY event_count DESC
      LIMIT 10
    `)

    res.json({
      success: true,
      data: {
        today: {
          total: Number(today.total),
          failed_logins: Number(today.failed_logins),
          rate_limited: Number(today.rate_limited),
          unauthorized: Number(today.unauthorized),
          unique_ips: Number(today.unique_ips)
        },
        topIps: topIps.map(r => ({ ...r, event_count: Number(r.event_count), failed_logins: Number(r.failed_logins) }))
      }
    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getSecurityHistory = async (req, res) => {

  try {

    const days = Math.min(Math.max(parseInt(req.query.days) || 14, 1), 60)

    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as total,
        COALESCE(SUM(event_type = 'failed_login'), 0) as failed_logins,
        COALESCE(SUM(event_type = 'rate_limited'), 0) as rate_limited,
        COALESCE(SUM(event_type IN ('unauthorized', 'forbidden', 'invalid_token')), 0) as unauthorized
      FROM security_events
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date DESC
    `, [days])

    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        total: Number(r.total),
        failed_logins: Number(r.failed_logins),
        rate_limited: Number(r.rate_limited),
        unauthorized: Number(r.unauthorized)
      }))
    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getBlockedIps = async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT blocked_ips.*, users.name as blocked_by_name
      FROM blocked_ips
      LEFT JOIN users ON blocked_ips.blocked_by = users.id
      ORDER BY blocked_ips.created_at DESC
    `)

    res.json({ success: true, data: rows })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.blockIp = async (req, res) => {

  try {

    const { ip_address, reason } = req.body

    if (!ip_address || !ip_address.trim()) {
      return res.status(400).json({ success: false, message: 'IP address is required' })
    }

    if (ip_address.trim() === getClientIp(req)) {
      return res.status(400).json({ success: false, message: 'You cannot block your own IP address' })
    }

    await db.query(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_by) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE reason = ?, blocked_by = ?, created_at = NOW()`,
      [ip_address.trim(), reason || null, req.user.id, reason || null, req.user.id]
    )

    res.json({ success: true, message: `IP ${ip_address} has been blocked` })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.unblockIp = async (req, res) => {

  try {

    const { ip } = req.params

    await db.query('DELETE FROM blocked_ips WHERE ip_address = ?', [ip])

    res.json({ success: true, message: `IP ${ip} has been unblocked` })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getSecurityEvents = async (req, res) => {

  try {

    const page = Math.max(1, parseInt(req.query.page) || 1)

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

    const offset = (page - 1) * limit

    const { date, event_type, ip } = req.query

    const where = []

    const params = []

    if (date) { where.push('DATE(created_at) = ?'); params.push(date) }

    if (event_type) { where.push('event_type = ?'); params.push(event_type) }

    if (ip) { where.push('ip_address = ?'); params.push(ip) }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM security_events ${whereClause}`, params)

    const [rows] = await db.query(
      `SELECT * FROM security_events ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    const [eventTypes] = await db.query('SELECT DISTINCT event_type FROM security_events ORDER BY event_type')

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      eventTypes: eventTypes.map(r => r.event_type),
      suspiciousEvents: SUSPICIOUS_EVENTS
    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}
