const request = require('supertest')
const app = require('../src/app')
const db = require('../src/config/db')
const { authHeader, USERS } = require('./helpers/auth')

const subscriptionBody = (endpoint, overrides = {}) => ({
  endpoint,
  keys: { p256dh: 'p256dh-key-value', auth: 'auth-key-value' },
  ...overrides
})

describe('Push notifications API', () => {
  afterAll(() => db.end())

  it('exposes the VAPID public key', async () => {
    const res = await request(app).get('/api/push/vapid-public-key')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body).toHaveProperty('publicKey')
  })

  it('rejects subscribing without an endpoint or keys', async () => {
    const noEndpoint = await request(app).post('/api/push/subscribe').send({ keys: { p256dh: 'a', auth: 'b' } })
    expect(noEndpoint.status).toBe(400)

    const noKeys = await request(app).post('/api/push/subscribe').send({ endpoint: 'https://example.com/push/abc' })
    expect(noKeys.status).toBe(400)
  })

  it('stores a session-based subscription', async () => {
    const endpoint = 'https://fcm.googleapis.com/fcm/send/test-session-endpoint'

    const res = await request(app).post('/api/push/subscribe').send(subscriptionBody(endpoint, { session_id: 9200 }))
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const [rows] = await db.query('SELECT * FROM push_subscriptions WHERE endpoint = ?', [endpoint])
    expect(rows).toHaveLength(1)
    expect(rows[0].session_id).toBe(9200)
    expect(rows[0].user_id).toBeNull()
  })

  it('upserts on a repeat subscription for the same endpoint', async () => {
    const endpoint = 'https://fcm.googleapis.com/fcm/send/test-session-endpoint'

    const res = await request(app)
      .post('/api/push/subscribe')
      .send(subscriptionBody(endpoint, { session_id: 9200, keys: { p256dh: 'updated-key', auth: 'updated-auth' } }))
    expect(res.status).toBe(200)

    const [rows] = await db.query('SELECT * FROM push_subscriptions WHERE endpoint = ?', [endpoint])
    expect(rows).toHaveLength(1)
    expect(rows[0].p256dh).toBe('updated-key')
    expect(rows[0].auth_key).toBe('updated-auth')
  })

  it('associates a subscription with the authenticated user', async () => {
    const endpoint = 'https://fcm.googleapis.com/fcm/send/test-user-endpoint'

    const res = await request(app)
      .post('/api/push/subscribe')
      .set('Authorization', authHeader('manager'))
      .send(subscriptionBody(endpoint))

    expect(res.status).toBe(200)

    const [rows] = await db.query('SELECT * FROM push_subscriptions WHERE endpoint = ?', [endpoint])
    expect(rows).toHaveLength(1)
    expect(rows[0].user_id).toBe(USERS.manager.id)
  })

  it('rejects unsubscribing without an endpoint', async () => {
    const res = await request(app).post('/api/push/unsubscribe').send({})
    expect(res.status).toBe(400)
  })

  it('removes a subscription on unsubscribe', async () => {
    const endpoint = 'https://fcm.googleapis.com/fcm/send/test-session-endpoint'

    const res = await request(app).post('/api/push/unsubscribe').send({ endpoint })
    expect(res.status).toBe(200)

    const [rows] = await db.query('SELECT * FROM push_subscriptions WHERE endpoint = ?', [endpoint])
    expect(rows).toHaveLength(0)
  })
})
