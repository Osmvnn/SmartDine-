const request = require('supertest')
const app = require('../src/app')
const db = require('../src/config/db')
const { authHeader, USERS } = require('./helpers/auth')

async function createOrder(items) {
  const res = await request(app).post('/api/orders').send({ table_id: 2, items })
  expect(res.status).toBe(201)
  return res.body.data.order_id
}

async function advanceOrder(orderId, statuses) {
  for (const status of statuses) {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', authHeader('admin'))
      .send({ status })
    expect(res.status).toBe(200)
  }
}

describe('Payments API', () => {
  afterAll(() => db.end())

  it('returns 404 for an order with no payment', async () => {
    const res = await request(app).get('/api/payments/order/999999')
    expect(res.status).toBe(404)
  })

  describe('pre-paid order with refund', () => {
    let orderId
    let paymentId

    it('processes a pre-paid card payment with a tip and confirms the order', async () => {
      orderId = await createOrder([{ menu_item_id: 2, quantity: 1 }]) // Grilled Chicken $15.99

      const res = await request(app)
        .post('/api/payments')
        .send({ order_id: orderId, method: 'card', tip: 2 })

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual(
        expect.objectContaining({ status: 'paid', amount: 17.99, tip: 2 })
      )

      const order = await request(app).get(`/api/orders/${orderId}`)
      expect(order.body.data.order.status).toBe('confirmed')
      expect(order.body.data.order.estimated_ready_at).not.toBeNull()
    })

    it('rejects a second payment for an already-paid order', async () => {
      const res = await request(app).post('/api/payments').send({ order_id: orderId, method: 'card' })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/already paid/i)
    })

    it('returns the payment for the order', async () => {
      const res = await request(app).get(`/api/payments/order/${orderId}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('paid')
      expect(Number(res.body.data.tip_amount)).toBe(2)
      paymentId = res.body.data.id
    })

    it('lists the payment in recent payments with refund reasons', async () => {
      const res = await request(app)
        .get('/api/payments/recent')
        .set('Authorization', authHeader('cashier'))

      expect(res.status).toBe(200)
      expect(res.body.data.some(p => p.id === paymentId)).toBe(true)
      expect(res.body.refundReasons).toEqual(expect.arrayContaining(['customer_complaint', 'other']))
    })

    it('rejects a refund with an invalid reason', async () => {
      const res = await request(app)
        .post(`/api/payments/refund/${paymentId}`)
        .set('Authorization', authHeader('cashier'))
        .send({ reason: 'because' })

      expect(res.status).toBe(400)
    })

    it('refunds the payment with a valid reason', async () => {
      const res = await request(app)
        .post(`/api/payments/refund/${paymentId}`)
        .set('Authorization', authHeader('cashier'))
        .send({ reason: 'customer_complaint' })

      expect(res.status).toBe(200)

      const payment = await request(app).get(`/api/payments/order/${orderId}`)
      expect(payment.body.data.status).toBe('refunded')
      expect(payment.body.data.refund_reason).toBe('customer_complaint')
      expect(payment.body.data.refunded_by).toBe(USERS.cashier.id)
    })

    it('rejects refunding an already-refunded payment', async () => {
      const res = await request(app)
        .post(`/api/payments/refund/${paymentId}`)
        .set('Authorization', authHeader('cashier'))
        .send({ reason: 'other' })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/refunded/)
    })
  })

  describe('pay-after-serving (post) order with waiter/cashier confirmation', () => {
    let orderId
    let paymentId

    it('records a pending cash payment and confirms the order', async () => {
      orderId = await createOrder([{ menu_item_id: 3, quantity: 1 }]) // Soft Drink $2.99

      const res = await request(app)
        .post('/api/payments')
        .send({ order_id: orderId, method: 'cash', payment_timing: 'post' })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('pending')

      const order = await request(app).get(`/api/orders/${orderId}`)
      expect(order.body.data.order.status).toBe('confirmed')

      const payment = await request(app).get(`/api/payments/order/${orderId}`)
      expect(payment.body.data.status).toBe('pending')
      expect(payment.body.data.payment_timing).toBe('post')
      paymentId = payment.body.data.id
    })

    it('appears in pending payments for the cashier', async () => {
      const res = await request(app)
        .get('/api/payments/pending')
        .set('Authorization', authHeader('cashier'))

      expect(res.status).toBe(200)
      const entry = res.body.data.find(p => p.id === paymentId)
      expect(entry).toBeDefined()
      expect(Array.isArray(entry.items)).toBe(true)
    })

    it('lets the waiter mark the cash as collected before the order is served', async () => {
      const res = await request(app)
        .post(`/api/payments/confirm/${paymentId}`)
        .set('Authorization', authHeader('waiter'))

      expect(res.status).toBe(200)
      expect(res.body.message).toMatch(/awaiting cashier/i)
    })

    it('rejects a second waiter confirmation', async () => {
      await advanceOrder(orderId, ['preparing', 'ready', 'served'])

      const res = await request(app)
        .post(`/api/payments/confirm/${paymentId}`)
        .set('Authorization', authHeader('waiter'))

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/already confirmed/i)
    })

    it('lets the cashier finalize the payment and complete the order', async () => {
      const res = await request(app)
        .post(`/api/payments/confirm/${paymentId}`)
        .set('Authorization', authHeader('cashier'))

      expect(res.status).toBe(200)

      const payment = await request(app).get(`/api/payments/order/${orderId}`)
      expect(payment.body.data.status).toBe('paid')
      expect(payment.body.data.cashier_confirmed).toBeTruthy()

      const order = await request(app).get(`/api/orders/${orderId}`)
      expect(order.body.data.order.status).toBe('completed')
    })
  })

  describe('split payments', () => {
    it('rejects an empty splits array', async () => {
      const orderId = await createOrder([{ menu_item_id: 1, quantity: 1 }])

      const res = await request(app).post('/api/payments/split').send({ order_id: orderId, splits: [] })
      expect(res.status).toBe(400)
    })

    it('rejects splits that do not add up to the order total', async () => {
      const orderId = await createOrder([{ menu_item_id: 1, quantity: 1 }]) // $8.99

      const res = await request(app)
        .post('/api/payments/split')
        .send({ order_id: orderId, splits: [{ amount: 5, method: 'card', payer_name: 'A' }] })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/must equal order total/i)
    })

    it('splits the bill between two payers with one paying later', async () => {
      const orderId = await createOrder([{ menu_item_id: 1, quantity: 1 }]) // $8.99

      const res = await request(app)
        .post('/api/payments/split')
        .send({
          order_id: orderId,
          splits: [
            { amount: 4.5, method: 'card', payer_name: 'A' },
            { amount: 4.49, method: 'cash', payer_name: 'B', payment_timing: 'post' }
          ]
        })

      expect(res.status).toBe(200)
      expect(res.body.data.transactions).toHaveLength(2)
      expect(res.body.data.transactions.find(t => t.payer === 'A').status).toBe('paid')
      expect(res.body.data.transactions.find(t => t.payer === 'B').status).toBe('pending')

      const payments = await request(app).get(`/api/payments/order/${orderId}`)
      expect(Array.isArray(payments.body.data)).toBe(true)
      expect(payments.body.data).toHaveLength(2)

      const order = await request(app).get(`/api/orders/${orderId}`)
      expect(order.body.data.order.status).toBe('confirmed')
    })
  })
})
