const request = require('supertest')
const app = require('../src/app')
const db = require('../src/config/db')

describe('Auth API', () => {
  afterAll(() => db.end())

  it('logs in with valid credentials and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@smart.com', password: 'SmartDine@2024' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.token).toEqual(expect.any(String))
    expect(res.body.user).toMatchObject({ email: 'admin@smart.com', role: 'admin' })
  })

  it('rejects an invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@smart.com', password: 'wrong-password' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('rejects a login request missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@smart.com' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns the authenticated user profile', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@smart.com', password: 'SmartDine@2024' })

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ email: 'manager@smart.com', role: 'manager' })
  })

  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('rejects /me with a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token')

    expect(res.status).toBe(401)
  })
})
