const path = require('path')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { createDatabase } = require('../src/config/postgresDb')

const catalog = [
  {
    name: 'Starters', image: '/images/appetizers.svg', items: [
      ['Caesar Salad', 'Romaine, parmesan, and house dressing', 8.99, '/images/menu/1.jpg', 'vegetarian'],
      ['Garlic Bread', 'Toasted bread with garlic butter', 5.99, '/images/menu/3.jpg', 'vegetarian']
    ]
  },
  {
    name: 'Mains', image: '/images/main-course.svg', items: [
      ['Grilled Chicken', 'Herb-grilled chicken with vegetables', 15.99, '/images/menu/6.jpg', 'gluten-free'],
      ['Margherita Pizza', 'Tomato, mozzarella, and basil', 11.99, '/images/menu/25.jpg', 'vegetarian']
    ]
  },
  {
    name: 'Drinks', image: '/images/drinks.svg', items: [
      ['Fresh Orange Juice', 'Freshly squeezed orange juice', 4.99, '/images/menu/12.jpg', 'vegan'],
      ['Turkish Coffee', 'Traditional strong coffee', 3.75, '/images/menu/38.jpg', 'vegan']
    ]
  },
  {
    name: 'Desserts', image: '/images/desserts.svg', items: [
      ['Chocolate Lava Cake', 'Warm chocolate cake with a molten center', 8.99, '/images/menu/17.jpg', 'vegetarian'],
      ['Baklava', 'Layered pastry with pistachio and syrup', 6.50, '/images/menu/39.jpg', 'vegetarian']
    ]
  }
]

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (Boolean(email) !== Boolean(password)) throw new Error('Set both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, or neither')
  if (password && password.length < 16) throw new Error('SEED_ADMIN_PASSWORD must be at least 16 characters')

  const db = createDatabase()
  let connection
  try {
    connection = await db.getConnection()
    await connection.beginTransaction()

    if (email) {
      const [[existing]] = await connection.query('SELECT id, role FROM users WHERE email = ?', [email])
      if (existing && existing.role !== 'admin') throw new Error('SEED_ADMIN_EMAIL belongs to a non-admin account')
      if (!existing) {
        const hash = await bcrypt.hash(password, 12)
        await connection.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          ['Portfolio Admin', email, hash, 'admin'])
      }
    }

    for (let tableNumber = 1; tableNumber <= 5; tableNumber++) {
      const [[existing]] = await connection.query('SELECT id FROM restaurant_tables WHERE table_number = ?', [tableNumber])
      if (!existing) {
        await connection.query('INSERT INTO restaurant_tables (table_number, capacity, qr_token) VALUES (?, ?, ?)',
          [tableNumber, 4, crypto.randomBytes(24).toString('hex')])
      }
    }

    for (const category of catalog) {
      let [[row]] = await connection.query('SELECT id FROM menu_categories WHERE name = ? LIMIT 1', [category.name])
      if (!row) {
        const [result] = await connection.query(
          'INSERT INTO menu_categories (name, image_url) VALUES (?, ?)', [category.name, category.image])
        row = { id: result.insertId }
      }
      for (const [name, description, price, image, tags] of category.items) {
        const [[item]] = await connection.query('SELECT id FROM menu_items WHERE category_id = ? AND name = ? LIMIT 1', [row.id, name])
        if (!item) {
          await connection.query(
            'INSERT INTO menu_items (category_id, name, description, price, image_url, dietary_tags) VALUES (?, ?, ?, ?, ?, ?)',
            [row.id, name, description, price, image, tags]
          )
        }
      }
    }

    await connection.commit()
    console.log('Supabase demo catalog ready: 5 tables, 4 categories, 8 menu items.')
    console.log(email ? 'Admin account ready.' : 'Admin account skipped; set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one.')
  } catch (error) {
    if (connection) await connection.rollback()
    throw error
  } finally {
    if (connection) connection.release()
    await db.end()
  }
}

main().catch((error) => {
  console.error('Supabase seed failed:', error.message)
  process.exitCode = 1
})
