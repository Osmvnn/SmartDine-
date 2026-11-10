const db = require('../config/db')

exports.getPublicKey = (req, res) => {
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY || null })
}

exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'A valid push subscription is required' })
    }

    const userId = req.user.id
    const sessionId = null

    await db.query(
      process.env.DB_PROVIDER === 'postgres'
        ? `INSERT INTO push_subscriptions (user_id, session_id, endpoint, p256dh, auth_key)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (endpoint) DO UPDATE SET
             p256dh = CASE WHEN push_subscriptions.user_id = EXCLUDED.user_id THEN EXCLUDED.p256dh ELSE push_subscriptions.p256dh END,
             auth_key = CASE WHEN push_subscriptions.user_id = EXCLUDED.user_id THEN EXCLUDED.auth_key ELSE push_subscriptions.auth_key END,
             session_id = CASE WHEN push_subscriptions.user_id = EXCLUDED.user_id THEN NULL ELSE push_subscriptions.session_id END`
        : `INSERT INTO push_subscriptions (user_id, session_id, endpoint, p256dh, auth_key)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE p256dh = IF(user_id = VALUES(user_id), VALUES(p256dh), p256dh), auth_key = IF(user_id = VALUES(user_id), VALUES(auth_key), auth_key), session_id = IF(user_id = VALUES(user_id), NULL, session_id)`,
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
    await db.query('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?', [endpoint, req.user.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
