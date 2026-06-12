const request = require('supertest')
const app = require('../src/app')
const db = require('../src/config/db')

const SESSION_ID = 9100

describe('Loyalty API', () => {
  beforeAll(async () => {
    await db.query(
      'INSERT INTO loyalty_points (session_id, user_id, points, type, description) VALUES (?, NULL, 100, "earned", "test seed")',
      [SESSION_ID]
    )
  })

  afterAll(() => db.end())

  it('returns a zero balance and empty history for an unknown session', async () => {
    const res = await request(app).get('/api/loyalty/balance?session_id=8888')

    expect(res.status).toBe(200)
    expect(res.body.data.balance).toBe(0)
    expect(res.body.data.history).toEqual([])
  })

  it('returns the accumulated balance and history for a session', async () => {
    const res = await request(app).get(`/api/loyalty/balance?session_id=${SESSION_ID}`)

    expect(res.status).toBe(200)
    expect(res.body.data.balance).toBe(100)
    expect(res.body.data.history.length).toBeGreaterThan(0)
  })

  it('lists active rewards alongside the balance', async () => {
    const res = await request(app).get(`/api/loyalty/rewards?session_id=${SESSION_ID}`)

    expect(res.status).toBe(200)
    expect(res.body.data.balance).toBe(100)
    expect(res.body.data.rewards).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Free Soft Drink', points_cost: 50 })])
    )
  })

  it('rejects redemption with no points', async () => {
    const res = await request(app).post('/api/loyalty/redeem').send({ session_id: SESSION_ID })
    expect(res.status).toBe(400)
  })

  it('rejects redemption without a session_id or user_id', async () => {
    const res = await request(app).post('/api/loyalty/redeem').send({ points: 50 })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/session_id or user_id/i)
  })

  it('rejects redemption that exceeds the balance', async () => {
    const res = await request(app).post('/api/loyalty/redeem').send({ session_id: SESSION_ID, points: 200 })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/insufficient/i)
  })

  it('redeems points for a discount and reduces the balance', async () => {
    const redeem = await request(app).post('/api/loyalty/redeem').send({ session_id: SESSION_ID, points: 50 })

    expect(redeem.status).toBe(200)
    expect(redeem.body.data).toEqual({ discount: 5, pointsUsed: 50 })

    const balance = await request(app).get(`/api/loyalty/balance?session_id=${SESSION_ID}`)
    expect(balance.body.data.balance).toBe(50)
  })
})
