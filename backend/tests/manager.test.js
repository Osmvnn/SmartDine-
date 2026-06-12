const request = require('supertest')
const app = require('../src/app')
const db = require('../src/config/db')
const { authHeader } = require('./helpers/auth')

describe('Manager API', () => {
  afterAll(() => db.end())

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/manager/dashboard')
    expect(res.status).toBe(401)
  })

  it('rejects roles other than manager/admin', async () => {
    const res = await request(app)
      .get('/api/manager/dashboard')
      .set('Authorization', authHeader('kitchen'))

    expect(res.status).toBe(403)
  })

  it('returns dashboard summary metrics', async () => {
    const res = await request(app)
      .get('/api/manager/dashboard')
      .set('Authorization', authHeader('manager'))

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual(
      expect.objectContaining({
        todayOrders: expect.any(Number),
        todayRevenue: expect.any(Number),
        activeTables: expect.any(Number),
        totalTables: expect.any(Number),
        pendingOrders: expect.any(Number),
        completedToday: expect.any(Number),
        avgOrderValue: expect.any(Number),
        lowStockItems: expect.any(Array)
      })
    )
  })

  it('returns sales analytics with peak hours and day-of-week breakdowns', async () => {
    const res = await request(app)
      .get('/api/manager/sales')
      .set('Authorization', authHeader('admin'))

    expect(res.status).toBe(200)
    expect(res.body.data.peakHours).toHaveLength(24)
    expect(res.body.data.dayOfWeek).toHaveLength(7)
    expect(res.body.data.dayOfWeek.map(d => d.day)).toEqual(
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    )
    expect(Array.isArray(res.body.data.dailyRevenue)).toBe(true)
    expect(Array.isArray(res.body.data.topItems)).toBe(true)
    expect(Array.isArray(res.body.data.categoryRevenue)).toBe(true)
  })

  it('returns staff performance limited to waiters and cashiers', async () => {
    const res = await request(app)
      .get('/api/manager/staff-performance')
      .set('Authorization', authHeader('manager'))

    expect(res.status).toBe(200)
    expect(res.body.data.every(r => ['waiter', 'cashier'].includes(r.staff_role))).toBe(true)
    expect(res.body.data.map(r => r.staff_name)).toEqual(
      expect.arrayContaining(['Waiter Staff', 'Cashier Staff'])
    )
  })

  it('returns tip report totals', async () => {
    const res = await request(app)
      .get('/api/manager/tips')
      .set('Authorization', authHeader('manager'))

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual(
      expect.objectContaining({ tips: expect.any(Array), totalTips: expect.any(Number) })
    )
  })

  it('returns table occupancy stats', async () => {
    const res = await request(app)
      .get('/api/manager/tables')
      .set('Authorization', authHeader('manager'))

    expect(res.status).toBe(200)
    expect(res.body.data.tables.length).toBeGreaterThanOrEqual(2)
    expect(res.body.data).toEqual(
      expect.objectContaining({ occupancyRate: expect.any(Number), occupied: expect.any(Number), total: expect.any(Number) })
    )
  })

  it('exports a sales CSV report', async () => {
    const res = await request(app)
      .get('/api/manager/export/csv')
      .set('Authorization', authHeader('admin'))

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/csv/)
    expect(res.text.split('\n')[0]).toBe('Order ID,Table,Status,Total,Discount,Date')
  })
})
