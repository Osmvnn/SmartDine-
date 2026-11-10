const path = require('path')
const crypto = require('crypto')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
process.env.DB_PROVIDER = 'postgres'

const app = require('../src/app')
const db = require('../src/config/db')

async function main() {
  const server = app.listen(0, '127.0.0.1')
  let testUserId
  let testTableId
  let testCategoryId
  let testReservationId
  let testBlockedIp
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const base = `http://127.0.0.1:${server.address().port}`
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    for (const route of ['/api/menu/categories', '/api/menu/items', '/api/menu/grouped', `/api/reservations/available?date=${tomorrow}&time=18:00`]) {
      const response = await fetch(base + route)
      const body = await response.json()
      if (!response.ok || !body.success) {
        throw new Error(`${route}: ${response.status} ${body.error || body.message}`)
      }
      console.log(JSON.stringify({ route, status: response.status, rows: body.data.length }))
    }
    const email = `db-smoke-${crypto.randomUUID()}@example.test`
    const password = crypto.randomBytes(24).toString('hex')
    const register = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Temporary smoke test', email, password })
    })
    const registered = await register.json()
    if (register.status !== 201 || !registered.success) {
      throw new Error(`register: ${register.status} ${registered.message}`)
    }
    testUserId = registered.user.id
    const login = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const loggedIn = await login.json()
    if (!login.ok || !loggedIn.success) {
      throw new Error(`login: ${login.status} ${loggedIn.message}`)
    }
    const me = await fetch(base + '/api/auth/me', {
      headers: { authorization: `Bearer ${loggedIn.token}` }
    })
    const profile = await me.json()
    if (!me.ok || profile.data?.id !== testUserId) {
      throw new Error(`me: ${me.status} ${profile.message}`)
    }
    console.log(JSON.stringify({ route: '/api/auth/register → login → me', status: 200 }))
    const pushEndpoint = `https://example.test/push/${crypto.randomUUID()}`
    for (const key of ['first', 'rotated']) {
      const subscribe = await fetch(base + '/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${loggedIn.token}` },
        body: JSON.stringify({ endpoint: pushEndpoint, keys: { p256dh: key, auth: key } })
      })
      const result = await subscribe.json()
      if (!subscribe.ok || !result.success) throw new Error(`push subscribe: ${subscribe.status} ${result.message}`)
    }
    const unsubscribe = await fetch(base + '/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${loggedIn.token}` },
      body: JSON.stringify({ endpoint: pushEndpoint })
    })
    if (!unsubscribe.ok) throw new Error(`push unsubscribe: ${unsubscribe.status}`)
    console.log(JSON.stringify({ route: '/api/push/subscribe → upsert → unsubscribe', status: 200 }))
    const qrToken = `db-smoke-${crypto.randomUUID()}`
    ;[{ insertId: testCategoryId }] = await db.query(
      'INSERT INTO menu_categories (name) VALUES (?)', [`Smoke ${crypto.randomUUID()}`]
    )
    const [{ insertId: itemId }] = await db.query(
      'INSERT INTO menu_items (category_id, name, price) VALUES (?, ?, ?)',
      [testCategoryId, 'Temporary smoke item', 5]
    )
    ;[{ insertId: testTableId }] = await db.query(
      'INSERT INTO restaurant_tables (table_number, qr_token) VALUES (?, ?)',
      [Math.floor(Math.random() * 1000000000) + 100000000, qrToken]
    )
    const reservationInput = {
      table_id: testTableId, customer_name: 'Temporary smoke guest',
      reservation_date: tomorrow, reservation_time: '18:00', guests: 2
    }
    const reserve = await fetch(base + '/api/reservations', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(reservationInput)
    })
    const reserved = await reserve.json()
    if (reserve.status !== 201 || !reserved.data?.id) {
      throw new Error(`create reservation: ${reserve.status} ${reserved.message}`)
    }
    testReservationId = reserved.data.id
    const conflict = await fetch(base + '/api/reservations', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(reservationInput)
    })
    if (conflict.status !== 400) {
      throw new Error(`reservation conflict: expected 400, got ${conflict.status}`)
    }
    console.log(JSON.stringify({ route: '/api/reservations → conflict', status: 400 }))
    const createOrder = await fetch(base + '/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${loggedIn.token}`, 'x-table-token': qrToken },
      body: JSON.stringify({ table_id: testTableId, items: [{ menu_item_id: itemId, quantity: 1 }], payment_type: 'physical', payment_method: 'cash' })
    })
    const createdOrder = await createOrder.json()
    if (createOrder.status !== 201 || !createdOrder.success) {
      throw new Error(`create order: ${createOrder.status} ${createdOrder.message}`)
    }
    const orderId = createdOrder.data.order_id
    const arrange = await fetch(base + '/api/payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${loggedIn.token}` },
      body: JSON.stringify({ order_id: orderId, method: 'cash', payment_timing: 'post' })
    })
    const arranged = await arrange.json()
    if (!arrange.ok || !arranged.success) {
      throw new Error(`arrange pay-later: ${arrange.status} ${arranged.message}`)
    }
    console.log(JSON.stringify({ route: '/api/orders → /api/payments (pay later)', status: 200 }))
    await db.query("UPDATE users SET role = 'admin' WHERE id = ?", [testUserId])
    const adminLogin = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const admin = await adminLogin.json()
    if (!adminLogin.ok || admin.user?.role !== 'admin') {
      throw new Error(`admin login: ${adminLogin.status} ${admin.message}`)
    }
    testBlockedIp = `2001:db8::${crypto.randomBytes(8).toString('hex')}`
    for (const reason of ['smoke test', 'updated smoke test']) {
      const block = await fetch(base + '/api/admin/security/block-ip', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${admin.token}` },
        body: JSON.stringify({ ip_address: testBlockedIp, reason })
      })
      const result = await block.json()
      if (!block.ok || !result.success) throw new Error(`block IP: ${block.status} ${result.message}`)
    }
    console.log(JSON.stringify({ route: '/api/admin/security/block-ip → upsert', status: 200 }))
    const paymentResponse = await fetch(base + `/api/payments/order/${orderId}`, {
      headers: { authorization: `Bearer ${admin.token}` }
    })
    const payment = await paymentResponse.json()
    if (!paymentResponse.ok || !payment.data?.id) {
      throw new Error(`read payment: ${paymentResponse.status} ${payment.message}`)
    }
    const confirm = await fetch(base + `/api/payments/confirm/${payment.data.id}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${admin.token}` }
    })
    const confirmed = await confirm.json()
    if (!confirm.ok || !confirmed.success) {
      throw new Error(`confirm cash: ${confirm.status} ${confirmed.message}`)
    }
    for (const status of ['preparing', 'ready', 'served', 'completed']) {
      const transition = await fetch(base + `/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${admin.token}` },
        body: JSON.stringify({ status })
      })
      const result = await transition.json()
      if (!transition.ok || !result.success) {
        throw new Error(`order ${status}: ${transition.status} ${result.message}`)
      }
    }
    console.log(JSON.stringify({ route: '/api/payments/confirm → order completed', status: 200 }))
    const staffRoutes = [
      '/api/admin/stats', '/api/admin/users', '/api/admin/categories',
      '/api/admin/items', '/api/admin/tables', '/api/admin/waiters',
      '/api/admin/orders', '/api/admin/orders/history', '/api/admin/loyalty-rewards',
      '/api/admin/security/summary', '/api/admin/security/history',
      '/api/admin/security/events', '/api/admin/security/blocked-ips',
      '/api/manager/dashboard', '/api/manager/sales', '/api/manager/tips',
      '/api/manager/staff-performance', '/api/manager/tables', '/api/manager/tables/history',
      '/api/kitchen/orders', '/api/kitchen/orders/history', '/api/kitchen/orders/by-date',
      '/api/waiter-requests', '/api/waiter-requests/orders', '/api/tables',
      '/api/shifts', '/api/shifts/history', '/api/reservations'
    ]
    const failures = []
    for (const route of staffRoutes) {
      const response = await fetch(base + route, {
        headers: { authorization: `Bearer ${admin.token}` }
      })
      const body = await response.json()
      if (!response.ok || !body.success) {
        failures.push(`${route}: ${response.status} ${body.message}`)
      } else {
        console.log(JSON.stringify({ route, status: response.status }))
      }
    }
    if (failures.length) throw new Error(failures.join('\n'))
  } finally {
    try {
      if (testBlockedIp) await db.query('DELETE FROM blocked_ips WHERE ip_address = ?', [testBlockedIp])
      if (testTableId) {
        await db.query('DELETE FROM loyalty_points WHERE order_id IN (SELECT id FROM orders WHERE table_id = ?)', [testTableId])
        await db.query('DELETE FROM orders WHERE table_id = ?', [testTableId])
        if (testReservationId) await db.query('DELETE FROM reservations WHERE id = ?', [testReservationId])
        await db.query('DELETE FROM restaurant_tables WHERE id = ?', [testTableId])
      }
      if (testCategoryId) await db.query('DELETE FROM menu_categories WHERE id = ?', [testCategoryId])
      if (testUserId) await db.query('DELETE FROM users WHERE id = ?', [testUserId])
    } finally {
      await new Promise((resolve) => server.close(resolve))
      await db.end()
    }
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
