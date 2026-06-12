const request = require('supertest')
const app = require('../src/app')
const db = require('../src/config/db')

describe('Menu API', () => {
  afterAll(() => db.end())

  it('lists menu categories', async () => {
    const res = await request(app).get('/api/menu/categories')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.map(c => c.name)).toEqual(
      expect.arrayContaining(['Appetizers', 'Main Course', 'Drinks'])
    )
  })

  it('lists menu items including modifiers and dietary tags', async () => {
    const res = await request(app).get('/api/menu/items')

    expect(res.status).toBe(200)
    const salad = res.body.data.find(i => i.id === 1)
    expect(salad.dietary_tags).toBe('vegetarian')
    expect(salad.modifiers).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Extra Cheese', price_delta: '1.50' })])
    )
  })

  it('groups available items by category', async () => {
    const res = await request(app).get('/api/menu/grouped')

    expect(res.status).toBe(200)
    const appetizers = res.body.data.find(c => c.name === 'Appetizers')
    expect(appetizers.items.some(i => i.id === 1)).toBe(true)

    const drinks = res.body.data.find(c => c.name === 'Drinks')
    expect(drinks.items.some(i => i.id === 3)).toBe(true)
  })

  it('toggles favorites for a session', async () => {
    const sessionId = 9001

    const add = await request(app)
      .post('/api/menu/favorites')
      .send({ session_id: sessionId, menu_item_id: 1 })
    expect(add.status).toBe(200)
    expect(add.body.favorited).toBe(true)

    const list = await request(app).get(`/api/menu/favorites?session_id=${sessionId}`)
    expect(list.body.data.some(f => f.menu_item_id === 1)).toBe(true)

    const remove = await request(app)
      .post('/api/menu/favorites')
      .send({ session_id: sessionId, menu_item_id: 1 })
    expect(remove.status).toBe(200)
    expect(remove.body.favorited).toBe(false)
  })

  it('rejects toggling a favorite without a menu_item_id', async () => {
    const res = await request(app).post('/api/menu/favorites').send({ session_id: 9001 })
    expect(res.status).toBe(400)
  })
})
