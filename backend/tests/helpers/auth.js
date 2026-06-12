const path = require('path')
const jwt = require('jsonwebtoken')

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

// Mirrors the fixture rows inserted by database/init_test_db.js
const USERS = {
  admin: { id: 1, name: 'Admin User', email: 'admin@smart.com', role: 'admin' },
  manager: { id: 2, name: 'Manager User', email: 'manager@smart.com', role: 'manager' },
  kitchen: { id: 3, name: 'Kitchen Staff', email: 'kitchen@smart.com', role: 'kitchen' },
  waiter: { id: 4, name: 'Waiter Staff', email: 'waiter@smart.com', role: 'waiter' },
  cashier: { id: 5, name: 'Cashier Staff', email: 'cashier@smart.com', role: 'cashier' },
  customer: { id: 6, name: 'Test Customer', email: 'customer@smart.com', role: 'customer' }
}

function tokenFor(role) {
  return jwt.sign(USERS[role], process.env.JWT_SECRET, { expiresIn: '1h' })
}

function authHeader(role) {
  return `Bearer ${tokenFor(role)}`
}

module.exports = { USERS, tokenFor, authHeader }
