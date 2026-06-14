const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const TEST_DB = process.env.TEST_DB_NAME || 'smart_restaurant_test'

async function initTestDb() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: 3306,
    multipleStatements: true
  })

  await conn.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``)
  await conn.query(`CREATE DATABASE \`${TEST_DB}\``)
  await conn.query(`USE \`${TEST_DB}\``)

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    .replace(/^﻿/, '')
    .replace(/CREATE DATABASE IF NOT EXISTS smart_restaurant;/i, '')
    .replace(/USE smart_restaurant;/i, '')

  await conn.query(schemaSql)

  const hash = await bcrypt.hash('SmartDine@2024', 10)
  await conn.query(
    `INSERT INTO users (name, email, password, role) VALUES
     ('Admin User', 'admin@smart.com', ?, 'admin'),
     ('Manager User', 'manager@smart.com', ?, 'manager'),
     ('Kitchen Staff', 'kitchen@smart.com', ?, 'kitchen'),
     ('Waiter Staff', 'waiter@smart.com', ?, 'waiter'),
     ('Cashier Staff', 'cashier@smart.com', ?, 'cashier'),
     ('Test Customer', 'customer@smart.com', ?, 'customer')`,
    [hash, hash, hash, hash, hash, hash]
  )

  await conn.query(
    `INSERT INTO restaurant_tables (table_number, capacity, status, qr_token) VALUES
     (1, 4, 'available', 'test_table_1'),
     (2, 4, 'available', 'test_table_2')`
  )

  await conn.query(
    `INSERT INTO menu_categories (id, name, description) VALUES
     (1, 'Appetizers', 'Starters'),
     (2, 'Main Course', 'Mains'),
     (3, 'Drinks', 'Beverages')`
  )

  await conn.query(
    `INSERT INTO menu_items (id, category_id, name, description, price, is_available, stock_quantity, prep_time_minutes, dietary_tags) VALUES
     (1, 1, 'Caesar Salad', 'Fresh salad', 8.99, 1, -1, 10, 'vegetarian'),
     (2, 2, 'Grilled Chicken', 'Chicken with vegetables', 15.99, 1, -1, 20, 'gluten-free'),
     (3, 3, 'Soft Drink', 'Coca-Cola', 2.99, 1, 50, 2, 'vegan,vegetarian'),
     (4, 2, 'Out of Stock Special', 'Limited item', 12.00, 1, 0, 15, NULL)`
  )

  await conn.query(
    `INSERT INTO menu_item_modifiers (menu_item_id, name, price_delta) VALUES
     (1, 'Extra Cheese', 1.50),
     (1, 'No Croutons', 0.00)`
  )

  await conn.query(
    `INSERT INTO loyalty_rewards (name, description, points_cost, menu_item_id, is_active) VALUES
     ('Free Soft Drink', 'Redeem points for a free soft drink', 50, 3, 1)`
  )

  await conn.end()
}

module.exports = initTestDb

if (require.main === module) {
  initTestDb()
    .then(() => { console.log(`Test database "${TEST_DB}" initialized.`); process.exit(0) })
    .catch(err => { console.error(err); process.exit(1) })
}
