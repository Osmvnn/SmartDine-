const { test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const jwt = require('jsonwebtoken')
const { io: client } = require('../../frontend/node_modules/socket.io-client')

// Exercise real Express routes and Socket.IO connections without touching restaurant data.
process.env.JWT_SECRET = 'isolated-security-test-secret-not-for-deployment'
process.env.NODE_ENV = 'test'
process.env.ALLOW_DEMO_PAYMENTS = 'false'
const users = new Map([
  [1, { id: 1, role: 'customer', is_active: 1 }],
  [2, { id: 2, role: 'customer', is_active: 1 }],
  [3, { id: 3, role: 'waiter', is_active: 1 }],
  [4, { id: 4, role: 'cashier', is_active: 1 }],
  [5, { id: 5, role: 'admin', is_active: 1 }]
])
let order, payments, writes, history, earned, failInsert, snapshot, reads
function reset() {
  order = { id: 10, customer_id: 1, waiter_id: 3, table_id: 7, session_id: 8, total: 20, status: 'pending' }
  payments = [{ id: 20, order_id: 10, amount: 20, tip_amount: 0, status: 'pending', payment_timing: 'pre' }]
  writes = []; history = []; earned = 0; failInsert = false; reads = []
}
async function query(raw, args = []) {
  const sql = raw.replace(/\s+/g, ' ').trim()
  if (sql.startsWith('SELECT')) reads.push({ sql, args })
  if (sql.startsWith('INSERT INTO security_events')) return [{ insertId: 1 }]
  if (sql.startsWith('INSERT INTO push_subscriptions')) { writes.push({ sql, args }); return [{ insertId: 1 }] }
  if (sql.startsWith('DELETE FROM push_subscriptions')) { writes.push({ sql, args }); return [{ affectedRows: 0 }] }
  if (sql.includes('as earned FROM loyalty_points')) return [[{ earned: 0 }]]
  if (sql.includes('as redeemed FROM loyalty_points')) return [[{ redeemed: 0 }]]
  if (sql.startsWith('SELECT * FROM loyalty_points')) return [[]]
  if (sql.startsWith('SELECT COUNT(*) AS count FROM payments')) return [[{ count: payments.filter(p => p.status === 'paid').length }]]
  if (sql.startsWith('SELECT id, name, email, role, is_active')) return [[users.get(Number(args[0]))].filter(Boolean)]
  if (sql.startsWith('SELECT id FROM users WHERE email')) return [[]]
  if (sql.startsWith('INSERT INTO users')) { writes.push({ sql, args }); return [{ insertId: 99 }] }
  if (sql.startsWith('SELECT o.*, t.waiter_id') || sql.startsWith('SELECT o.customer_id, t.waiter_id')) return [Number(args[0]) === order.id ? [{ ...order }] : []]
  if (sql.startsWith('SELECT * FROM orders WHERE id') || sql.startsWith('SELECT id, status, table_id')) return [Number(args[0]) === order.id ? [{ ...order }] : []]
  if (sql.includes('orders.*') && sql.includes('WHERE orders.id')) return [[{ ...order }]]
  if (sql.startsWith('SELECT order_id FROM payments WHERE id')) return [payments.filter(p => p.id === Number(args[0])).map(p => ({ order_id: p.order_id }))]
  if (sql.startsWith('SELECT * FROM payments WHERE id')) return [payments.filter(p => p.id === Number(args[0])).map(p => ({ ...p }))]
  if (sql.startsWith('SELECT * FROM payments WHERE order_id')) return [payments.map(p => ({ ...p }))]
  if (sql.includes('AS paid, SUM(CASE WHEN status')) return [[{ paid: payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount - p.tip_amount, 0), pending: payments.filter(p => p.status === 'pending').length }]]
  if (sql.includes('MAX(mi.prep_time_minutes)')) return [[{ maxPrep: 15 }]]
  if (sql.startsWith('SELECT table_id FROM table_sessions')) return [[{ table_id: 7 }]]
  if (sql.startsWith('SELECT table_id FROM waiter_requests')) return [[{ table_id: 7 }]]
  if (sql.startsWith('SELECT id, waiter_id FROM restaurant_tables')) return [[{ id: 7, waiter_id: 3 }]]
  if (sql.startsWith('SELECT waiter_id FROM restaurant_tables')) return [[{ waiter_id: 3 }]]
  if (sql.startsWith('SELECT id FROM restaurant_tables WHERE id')) return [Number(args[0]) === 7 && args[1] === 'table-secret' ? [{ id: 7 }] : []]
  if (sql.startsWith('SELECT * FROM order_status_history')) return [history]
  if (sql.includes('FROM order_items')) return [[]]
  if (sql.startsWith('DELETE FROM payments')) { payments = payments.filter(p => p.status !== 'pending'); writes.push({ sql, args }); return [{ affectedRows: 1 }] }
  if (sql.startsWith('INSERT INTO payments')) {
    if (failInsert) throw new Error('Injected write failure')
    payments.push({ id: 20 + payments.length, order_id: args[0], amount: args[1], method: args[2], status: args[3], transaction_id: args[4], payment_timing: args[7], tip_amount: args[8] })
    writes.push({ sql, args }); return [{ insertId: 20 }]
  }
  if (sql.startsWith('UPDATE orders SET status')) { order.status = args[0]; writes.push({ sql, args }); return [{ affectedRows: 1 }] }
  if (sql.startsWith('UPDATE orders SET')) { writes.push({ sql, args }); return [{ affectedRows: 1 }] }
  if (sql.startsWith('INSERT INTO order_status_history')) { history.push({ status: args[1] }); return [{ insertId: 1 }] }
  if (sql.startsWith("UPDATE payments SET status = 'paid'")) { payments.find(p => p.id === Number(args[1])).status = 'paid'; return [{ affectedRows: 1 }] }
  if (sql.startsWith('UPDATE payments SET waiter_confirmed_by')) { payments.find(p => p.id === Number(args[1])).waiter_confirmed_by = args[0]; return [{ affectedRows: 1 }] }
  if (sql.startsWith('INSERT INTO loyalty_points')) { earned++; return [{ insertId: 1 }] }
  throw new Error(`Unexpected test query: ${sql}`)
}
const connection = {
  query,
  async beginTransaction() { snapshot = structuredClone({ order, payments, writes, history, earned }) },
  async commit() { snapshot = null },
  async rollback() { if (snapshot) ({ order, payments, writes, history, earned } = snapshot); snapshot = null },
  release() {}
}
const dbPath = require.resolve('../src/config/db')
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { query, getConnection: async () => connection } }
const express = require('express')
const app = express()
app.use(express.json())
for (const [prefix, file] of Object.entries({ auth: 'auth', orders: 'order', payments: 'payment', receipts: 'receipt', reservations: 'reservation', tables: 'table', 'waiter-requests': 'waiterRequest', push: 'push', loyalty: 'loyalty' })) {
  app.use(`/api/${prefix}`, require(`../src/routes/${file}Routes`))
}
app.use((err, req, res, next) => res.status(500).json({ message: err.message }))
const socketServer = require('../src/socket')
const server = http.createServer(app)
const io = socketServer.init(server)
let base
const token = (id, claims = {}) => jwt.sign({ id, role: users.get(id)?.role, ...claims }, process.env.JWT_SECRET, { expiresIn: '1h' })
async function request(path, { id, method = 'GET', body, bearer } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (id || bearer) headers.Authorization = `Bearer ${bearer || token(id)}`
  return fetch(base + '/api' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
}
before(async () => { await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}` })
beforeEach(reset)
after(async () => { await new Promise(resolve => io.close(resolve)); server.closeAllConnections() })

test('public signup cannot mint staff roles', async () => {
  const res = await request('/auth/register', { method: 'POST', body: { name: 'Test', email: 'test@example.test', password: 'test-password', role: 'admin' } })
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.equal(data.user.role, 'customer')
  assert.equal(jwt.verify(data.token, process.env.JWT_SECRET).role, 'customer')
  assert.equal(writes[0].args[3], 'customer')
})

test('sensitive endpoints reject anonymous requests before reaching controllers', async () => {
  for (const [method, path] of [ ['GET','/orders/10'], ['GET','/orders/table/7'], ['GET','/orders/session/8'], ['PUT','/orders/10/cancel'], ['POST','/orders/10/rate'], ['POST','/payments'], ['POST','/payments/split'], ['GET','/payments/order/10'], ['GET','/receipts/10'], ['GET','/reservations'], ['POST','/push/subscribe'], ['GET','/loyalty/balance'] ]) {
    assert.equal((await request(path, { method, body: method === 'GET' ? undefined : {} })).status, 401, path)
  }
  assert.equal(writes.length, 0)
})

test('other customers cannot read, cancel, rate, pay, or download an order', async () => {
  for (const [method,path] of [['GET','/orders/10'], ['PUT','/orders/10/cancel'], ['POST','/orders/10/rate'], ['GET','/receipts/10'], ['GET','/payments/order/10'], ['POST','/payments'], ['POST','/payments/split']]) {
    assert.equal((await request(path, { id: 2, method, body: method === 'GET' ? undefined : { order_id: 10 } })).status, 403, path)
  }
  assert.equal(writes.length, 0)
})

test('owner can read an order; table-wide history remains staff-only', async () => {
  const res = await request('/orders/10', { id: 1 })
  assert.equal(res.status, 200, JSON.stringify(await res.clone().json()))
  assert.equal((await res.json()).data.order.id, 10)
  assert.equal((await request('/orders/table/7', { id: 1 })).status, 403)
  assert.equal((await request('/orders/session/8', { id: 1 })).status, 403)
})

test('waiters cannot act on another waiter’s table', async () => {
  order.waiter_id = 99
  for (const [method,path,body] of [['GET','/orders/10'], ['PUT','/orders/10/status',{ status: 'served' }], ['POST','/payments/confirm/20',{}]]) {
    assert.equal((await request(path, { id: 3, method, body })).status, 403)
  }
})

test('expired, deactivated and changed-role tokens fail; optional auth fails closed', async () => {
  const oldToken = token(1)
  users.get(1).is_active = 0
  assert.equal((await request('/orders/10', { bearer: oldToken })).status, 401)
  users.get(1).is_active = 1
  assert.equal((await request('/orders/10', { bearer: token(1, { role: 'admin' }) })).status, 401)
  const expired = jwt.sign({ id: 1, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: -1 })
  assert.equal((await request('/orders/10', { bearer: expired })).status, 401)
  assert.equal((await request('/reservations', { method: 'POST', bearer: 'invalid', body: {} })).status, 401)
})

test('invalid quantities and missing table proof fail before order creation', async () => {
  assert.equal((await request('/orders', { id: 1, method: 'POST', body: { table_id: 7, items: [{ menu_item_id: 1, quantity: -1 }] } })).status, 400)
  assert.equal((await request('/orders', { id: 1, method: 'POST', body: { table_id: 7, items: [{ menu_item_id: 1, quantity: 1 }] } })).status, 403)
})

test('client payment status cannot verify payment', async () => {
  assert.equal((await request('/payments', { id: 1, method: 'POST', body: { order_id: 10, status: 'paid', payment_timing: 'post' } })).status, 400)
  assert.equal(writes.length, 0)
})

test('online single and split payments fail closed without a provider', async () => {
  assert.equal((await request('/payments', { id: 1, method: 'POST', body: { order_id: 10, payment_timing: 'pre' } })).status, 409)
  assert.equal((await request('/payments/split', { id: 1, method: 'POST', body: { order_id: 10, splits: [{ amount: 10, payment_timing: 'post' }, { amount: 10, payment_timing: 'pre' }] } })).status, 409)
  assert.equal(payments.length, 1)
  assert.equal(payments[0].status, 'pending')
  assert.equal(writes.length, 0)
})

test('pay-later confirms preparation without claiming payment or issuing rewards', async () => {
  const res = await request('/payments', { id: 1, method: 'POST', body: { order_id: 10, method: 'cash', payment_timing: 'post' } })
  assert.equal(res.status, 200)
  assert.equal((await res.json()).data.status, 'pending')
  assert.equal(order.status, 'confirmed')
  assert.equal(earned, 0)
  assert.equal((await request('/payments', { id: 1, method: 'POST', body: { order_id: 10, payment_timing: 'post' } })).status, 409)
})

test('invalid split totals and injected database failures preserve pending payments', async () => {
  const bad = await request('/payments/split', { id: 1, method: 'POST', body: { order_id: 10, splits: [{ amount: -1, payment_timing: 'post' }] } })
  assert.equal(bad.status, 400)
  failInsert = true
  const res = await request('/payments', { id: 1, method: 'POST', body: { order_id: 10, payment_timing: 'post' } })
  assert.equal(res.status, 500)
  assert.equal(order.status, 'pending')
  assert.equal(payments.length, 1)
  assert.equal(payments[0].id, 20)
})

test('one split cannot complete the bill; final settlement earns points once', async () => {
  order.status = 'served'
  payments = [20,21].map(id => ({ id, order_id: 10, status: 'pending', payment_timing: 'post', amount: 10, tip_amount: 0 }))
  assert.equal((await request('/payments/confirm/20', { id: 4, method: 'POST', body: {} })).status, 200)
  assert.equal(order.status, 'served')
  assert.equal(earned, 0)
  assert.equal((await request('/payments/confirm/21', { id: 4, method: 'POST', body: {} })).status, 200)
  assert.equal(order.status, 'completed')
  assert.equal(earned, 1)
  assert.equal((await request('/payments/confirm/21', { id: 4, method: 'POST', body: {} })).status, 409)
})

test('cashier cannot manually verify pending online payments', async () => {
  assert.equal((await request('/payments/confirm/20', { id: 4, method: 'POST', body: {} })).status, 409)
  assert.equal(payments[0].status, 'pending')
})

test('waiter collection remains pending until cashier verification', async () => {
  payments[0].payment_timing = 'post'
  order.status = 'confirmed'
  assert.equal((await request('/payments/confirm/20', { id: 3, method: 'POST', body: {} })).status, 200)
  assert.equal(payments[0].status, 'pending')
  assert.equal(payments[0].waiter_confirmed_by, 3)
  assert.equal(earned, 0)
  assert.equal((await request('/payments/confirm/20', { id: 4, method: 'POST', body: {} })).status, 200)
  assert.equal(payments[0].status, 'paid')
  assert.equal(earned, 1)
})

test('generic status changes cannot bypass settlement or arrangement', async () => {
  assert.equal((await request('/orders/10/status', { id: 5, method: 'PUT', body: { status: 'confirmed' } })).status, 409)
  order.status = 'served'
  assert.equal((await request('/orders/10/status', { id: 3, method: 'PUT', body: { status: 'completed' } })).status, 409)
  assert.equal(order.status, 'served')
})

test('collected money cannot be overwritten or automatically refunded by cancellation', async () => {
  payments[0].status = 'paid'
  assert.equal((await request('/payments', { id: 1, method: 'POST', body: { order_id: 10, payment_timing: 'post' } })).status, 409)
  assert.equal((await request('/orders/10/cancel', { id: 1, method: 'PUT', body: {} })).status, 409)
  assert.equal(payments[0].status, 'paid')
})

test('no-charge orders require no payment provider', async () => {
  order.total = 0; payments[0].amount = 0
  const res = await request('/payments', { id: 1, method: 'POST', body: { order_id: 10, payment_timing: 'pre' } })
  assert.equal(res.status, 200)
  assert.equal((await res.json()).data.amount, 0)
  assert.equal(earned, 0)
})

test('loyalty identifiers come from the authenticated account', async () => {
  const res = await request('/loyalty/balance?user_id=2&session_id=99', { id: 1 })
  assert.equal(res.status, 200)
  const queries = reads.filter(q => q.sql.includes('FROM loyalty_points'))
  assert.equal(queries.length, 3)
  for (const q of queries) { assert.match(q.sql, /WHERE user_id = \?/); assert.deepEqual(q.args, [1]) }
})

test('push registration cannot nominate another user or table session', async () => {
  const res = await request('/push/subscribe', { id: 1, method: 'POST', body: { user_id: 2, session_id: 99, endpoint: 'https://push.example.test/a', keys: { p256dh: 'test', auth: 'test' } } })
  assert.equal(res.status, 200)
  assert.equal(writes[0].args[0], 1)
  assert.equal(writes[0].args[1], null)
  assert.equal((await request('/push/unsubscribe', { id: 1, method: 'POST', body: { endpoint: 'https://push.example.test/a', user_id: 2 } })).status, 200)
  assert.deepEqual(writes[1].args, ['https://push.example.test/a', 1])
})

test('customer refunds are forbidden and legacy online payments cannot be marked refunded', async () => {
  assert.equal((await request('/payments/refund/20', { id: 1, method: 'POST', body: { reason: 'other' } })).status, 403)
  payments[0].status = 'paid'
  assert.equal((await request('/payments/refund/20', { id: 4, method: 'POST', body: { reason: 'other' } })).status, 409)
  assert.equal(payments[0].status, 'paid')
})

test('demo payment success requires explicit development configuration', async () => {
  const { paymentStatus } = require('../src/services/paymentPolicy')
  process.env.ALLOW_DEMO_PAYMENTS = 'true'
  process.env.NODE_ENV = 'production'
  assert.throws(() => paymentStatus(20, 'pre'), /not configured/)
  process.env.NODE_ENV = 'development'
  assert.equal(paymentStatus(20, 'pre'), 'paid')
  assert.equal(paymentStatus(0, 'pre'), 'paid')
  process.env.NODE_ENV = 'test'; process.env.ALLOW_DEMO_PAYMENTS = 'false'
})

function connect(bearer) {
  return client(base, { auth: { token: bearer }, transports: ['websocket'], reconnection: false, forceNew: true })
}
function once(socket, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 2000)
    socket.once(event, (...args) => { clearTimeout(timer); resolve(args) })
  })
}
test('socket handshake requires a valid active account', async () => {
  const socket = connect('invalid')
  try { const [err] = await once(socket, 'connect_error'); assert.match(err.message, /Authentication/) }
  finally { socket.disconnect() }
})

test('socket rooms and outgoing order events are scoped to the authenticated account', async () => {
  const owner = connect(token(1)); const other = connect(token(2))
  try {
    await Promise.all([once(owner,'connect'), once(other,'connect')])
    for (const room of ['admin', 'waiter', 'user-1']) {
      const reply = await other.timeout(2000).emitWithAck('join', room)
      assert.equal(reply.success, false, room)
    }
    assert.equal((await other.timeout(2000).emitWithAck('join','user-2')).success, true)
    let leaked = false
    other.on('order-status-changed', () => { leaked = true })
    const received = once(owner, 'order-status-changed')
    await socketServer.emitOrderEvent(10, 'order-status-changed', { order_id: 10, status: 'ready' })
    assert.equal((await received)[0].order_id, 10)
    await new Promise(resolve => setTimeout(resolve, 75))
    assert.equal(leaked, false)
    users.get(2).is_active = 0
    const disconnected = once(other, 'disconnect')
    other.emit('join','user-2')
    await disconnected
  } finally { users.get(2).is_active = 1; owner.disconnect(); other.disconnect() }
})
