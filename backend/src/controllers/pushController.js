const jwt = require('jsonwebtoken')
const db = require('../config/db')
const { JWT_SECRET } = require('../middleware/auth')

function getOptionalUserId(req) {
  const header = req.header('Authorization')
  if (!header) return null
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET)
    return decoded.id
  } catch {
    return null
  }
}

exports.getPublicKey = (req, res) => {
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY || null })
}

exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys, session_id } = req.body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'A valid push subscription is required' })
    }

    const userId = getOptionalUserId(req)
    const sessionId = session_id || null

    await db.query(
      `INSERT INTO push_subscriptions (user_id, session_id, endpoint, p256dh, auth_key)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), session_id = VALUES(session_id), p256dh = VALUES(p256dh), auth_key = VALUES(auth_key)`,
      [userId, sessionId, endpoint, keys.p256dh, keys.auth]
    )

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'endpoint is required' })
    }
    await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
