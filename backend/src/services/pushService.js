const webpush = require('web-push')
const db = require('../config/db')

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@smartdine.local',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

async function sendToSubscription(sub, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
      JSON.stringify(payload)
    )
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      await db.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id])
    } else {
      console.error('Push send error:', err.message)
    }
  }
}

async function sendToSubscriptions(subs, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !subs.length) return
  await Promise.all(subs.map(sub => sendToSubscription(sub, payload)))
}

async function notifySession(sessionId, payload) {
  if (!sessionId) return
  const [subs] = await db.query('SELECT * FROM push_subscriptions WHERE session_id = ?', [sessionId])
  await sendToSubscriptions(subs, payload)
}

async function notifyUser(userId, payload) {
  if (!userId) return
  const [subs] = await db.query('SELECT ps.* FROM push_subscriptions ps JOIN users u ON u.id = ps.user_id WHERE ps.user_id = ? AND u.is_active = TRUE', [userId])
  await sendToSubscriptions(subs, payload)
}

async function notifyRoles(roles, payload) {
  if (!roles?.length) return
  const placeholders = roles.map(() => '?').join(', ')
  const [subs] = await db.query(
    `SELECT ps.* FROM push_subscriptions ps JOIN users u ON u.id = ps.user_id WHERE u.is_active = TRUE AND u.role IN (${placeholders})`,
    roles
  )
  await sendToSubscriptions(subs, payload)
}

module.exports = { notifySession, notifyUser, notifyRoles }
