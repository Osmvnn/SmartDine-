const request = require('supertest')
const app = require('../src/app')
const db = require('../src/config/db')

describe('Order creation rate limiting', () => {
  afterAll(() => db.end())

  it('blocks order creation after 20 requests within the window', async () => {
    const invalidPayload = { items: [{ menu_item_id: 1, quantity: 1 }] } // missing table_id -> 400, but still counted

    for (let i = 0; i < 20; i++) {
      const res = await request(app).post('/api/orders').send(invalidPayload)
      expect(res.status).toBe(400)
    }

    const res = await request(app).post('/api/orders').send(invalidPayload)
    expect(res.status).toBe(429)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/too many/i)
  }, 30000)
})
