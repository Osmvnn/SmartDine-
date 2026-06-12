const request = require('supertest')
const app = require('../src/app')
const db = require('../src/config/db')
const { authHeader } = require('./helpers/auth')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

describe('Admin API', () => {
  afterAll(() => db.end())

  describe('access control', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/admin/stats')
      expect(res.status).toBe(401)
    })

    it('rejects non-admin roles for admin-only routes', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', authHeader('manager'))

      expect(res.status).toBe(403)
    })

    it('allows managers to view items but not users', async () => {
      const items = await request(app)
        .get('/api/admin/items')
        .set('Authorization', authHeader('manager'))
      expect(items.status).toBe(200)

      const users = await request(app)
        .get('/api/admin/users')
        .set('Authorization', authHeader('manager'))
      expect(users.status).toBe(403)
    })
  })

  describe('dashboard stats', () => {
    it('returns aggregate counts for the admin', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', authHeader('admin'))

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual(
        expect.objectContaining({
          totalUsers: expect.any(Number),
          totalTables: expect.any(Number),
          totalItems: expect.any(Number),
          totalOrders: expect.any(Number),
          totalCategories: expect.any(Number)
        })
      )
    })
  })

  describe('users', () => {
    it('lists seeded users with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', authHeader('admin'))

      expect(res.status).toBe(200)
      expect(res.body.pagination).toEqual(
        expect.objectContaining({ page: 1, limit: 20 })
      )
      expect(res.body.data.map(u => u.email)).toEqual(
        expect.arrayContaining(['admin@smart.com', 'manager@smart.com'])
      )
    })

    it('rejects creating a user with a duplicate email', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', authHeader('admin'))
        .send({ name: 'Dup', email: 'admin@smart.com', password: 'whatever123', role: 'waiter' })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/already exists/i)
    })

    it('creates, updates and deletes a user', async () => {
      const create = await request(app)
        .post('/api/admin/users')
        .set('Authorization', authHeader('admin'))
        .send({ name: 'Temp Waiter', email: 'temp.waiter@smart.com', password: 'TempPass123', role: 'waiter' })

      expect(create.status).toBe(201)
      const userId = create.body.data.id

      const update = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', authHeader('admin'))
        .send({ name: 'Temp Waiter Updated', email: 'temp.waiter@smart.com', role: 'waiter', is_active: 1 })

      expect(update.status).toBe(200)

      const del = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', authHeader('admin'))

      expect(del.status).toBe(200)
    })
  })

  describe('categories and audit log', () => {
    let categoryId

    it('rejects creating a category without a name', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', authHeader('admin'))
        .send({})

      expect(res.status).toBe(400)
    })

    it('creates a category', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', authHeader('admin'))
        .send({ name: 'Desserts', description: 'Sweet treats' })

      expect(res.status).toBe(201)
      expect(res.body.data.id).toEqual(expect.any(Number))
      categoryId = res.body.data.id
    })

    it('lists the new category', async () => {
      const res = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', authHeader('admin'))

      expect(res.status).toBe(200)
      expect(res.body.data.some(c => c.id === categoryId && c.name === 'Desserts')).toBe(true)
    })

    it('records the category creation in the audit log', async () => {
      await wait(200) // audit log write happens asynchronously after the response

      const res = await request(app)
        .get('/api/admin/audit-log?entity_type=category')
        .set('Authorization', authHeader('admin'))

      expect(res.status).toBe(200)
      expect(res.body.data.some(entry =>
        entry.action === 'create' &&
        entry.entity_type === 'category' &&
        Number(entry.entity_id) === categoryId &&
        entry.user_name === 'Admin User'
      )).toBe(true)
      expect(res.body.entityTypes).toEqual(expect.arrayContaining(['category']))
    })

    it('updates and deletes the category', async () => {
      const update = await request(app)
        .put(`/api/admin/categories/${categoryId}`)
        .set('Authorization', authHeader('admin'))
        .send({ name: 'Desserts & Sweets', description: 'Updated' })
      expect(update.status).toBe(200)

      const del = await request(app)
        .delete(`/api/admin/categories/${categoryId}`)
        .set('Authorization', authHeader('admin'))
      expect(del.status).toBe(200)
    })

    it('allows managers to read the audit log', async () => {
      const res = await request(app)
        .get('/api/admin/audit-log')
        .set('Authorization', authHeader('manager'))

      expect(res.status).toBe(200)
      expect(res.body.pagination).toEqual(expect.objectContaining({ page: 1, limit: 20 }))
    })
  })
})
