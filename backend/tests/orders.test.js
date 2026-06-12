const request = require('supertest')
const app = require('../src/app')
const db = require('../src/config/db')
const { authHeader } = require('./helpers/auth')

describe('Orders API', () => {
  afterAll(() => db.end())

  it('rejects an order with no table_id', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ menu_item_id: 1, quantity: 1 }] })

    expect(res.status).toBe(400)
  })

  it('rejects an order for a non-existent table', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ table_id: 999, items: [{ menu_item_id: 1, quantity: 1 }] })

    expect(res.status).toBe(404)
  })

  it('rejects an order for an item with insufficient stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ table_id: 1, items: [{ menu_item_id: 4, quantity: 1 }] })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/stock/i)
  })

  describe('order lifecycle', () => {
    let orderId
    let itemIds

    it('creates an order with modifiers and computes the total', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          table_id: 1,
          items: [
            { menu_item_id: 1, quantity: 2, modifiers: [{ id: 1 }] }, // Caesar Salad x2 + Extra Cheese
            { menu_item_id: 3, quantity: 1 } // Soft Drink x1
          ]
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      orderId = res.body.data.order_id
      // (8.99 + 1.50) * 2 + 2.99 = 23.97
      expect(Number(res.body.data.total)).toBeCloseTo(23.97, 2)
    })

    it('returns the order with per-item kitchen status and modifier details', async () => {
      const res = await request(app).get(`/api/orders/${orderId}`)

      expect(res.status).toBe(200)
      expect(res.body.data.order.status).toBe('pending')
      expect(res.body.data.order.estimated_ready_at).toBeNull()
      expect(res.body.data.items).toHaveLength(2)
      expect(res.body.data.items.every(i => i.status === 'pending')).toBe(true)

      itemIds = res.body.data.items.map(i => i.id)
      const saladItem = res.body.data.items.find(i => Number(i.modifier_total) > 0)
      expect(saladItem.modifiers).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Extra Cheese' })])
      )
    })

    it('rejects status updates from a role without permission for the target status', async () => {
      // kitchen can move to preparing/ready, but not confirm a pending order
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', authHeader('kitchen'))
        .send({ status: 'confirmed' })

      expect(res.status).toBe(403)
    })

    it('confirms the order and sets an estimated ready time', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', authHeader('manager'))
        .send({ status: 'confirmed' })

      expect(res.status).toBe(200)

      const order = await request(app).get(`/api/orders/${orderId}`)
      expect(order.body.data.order.status).toBe('confirmed')
      expect(order.body.data.order.estimated_ready_at).not.toBeNull()
    })

    it('moves the order to preparing and cascades to its items', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', authHeader('kitchen'))
        .send({ status: 'preparing' })

      expect(res.status).toBe(200)

      const order = await request(app).get(`/api/orders/${orderId}`)
      expect(order.body.data.order.status).toBe('preparing')
      expect(order.body.data.items.every(i => i.status === 'preparing')).toBe(true)
    })

    it('marking the final item ready cascades the whole order to ready', async () => {
      const first = await request(app)
        .put(`/api/kitchen/orders/${orderId}/items/${itemIds[0]}/status`)
        .set('Authorization', authHeader('kitchen'))
        .send({ status: 'ready' })
      expect(first.status).toBe(200)

      let order = await request(app).get(`/api/orders/${orderId}`)
      expect(order.body.data.order.status).toBe('preparing')

      const second = await request(app)
        .put(`/api/kitchen/orders/${orderId}/items/${itemIds[1]}/status`)
        .set('Authorization', authHeader('kitchen'))
        .send({ status: 'ready' })
      expect(second.status).toBe(200)

      order = await request(app).get(`/api/orders/${orderId}`)
      expect(order.body.data.order.status).toBe('ready')
      expect(order.body.data.items.every(i => i.status === 'ready')).toBe(true)
    })

    it('lets a waiter mark the order served, then completed', async () => {
      const served = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', authHeader('waiter'))
        .send({ status: 'served' })
      expect(served.status).toBe(200)

      const completed = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', authHeader('waiter'))
        .send({ status: 'completed' })
      expect(completed.status).toBe(200)

      const order = await request(app).get(`/api/orders/${orderId}`)
      expect(order.body.data.order.status).toBe('completed')
    })

    it('rejects transitioning a completed order further', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', authHeader('admin'))
        .send({ status: 'preparing' })

      expect(res.status).toBe(400)
    })
  })
})
