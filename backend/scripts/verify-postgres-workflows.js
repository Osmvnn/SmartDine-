// Explicit integration command: creates only uniquely tagged fixtures and removes them.
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const path = require('node:path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
process.env.DB_PROVIDER = 'postgres'
const db = require('../src/config/db')
const app = require('../src/app')
const jwt = require('jsonwebtoken')
const tag = `verify-${crypto.randomUUID()}`

async function main() {
  const server = app.listen(0, '127.0.0.1')
  const users = [], tables = []
  let categoryId
  try {
    await new Promise(resolve => server.once('listening', resolve))
    const base = `http://127.0.0.1:${server.address().port}/api`
    async function request(method, route, body, token, expected = 200, tableToken) {
      const response = await fetch(base + route, {
        method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(tableToken ? { 'x-table-token': tableToken } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      })
      const result = await response.json()
      assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(result)}`)
      return result
    }
    const tokens = {}
    for (const role of ['customer', 'admin', 'waiter', 'cashier']) {
      const [user] = await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [tag, `${role}-${tag}@example.test`, 'no-login-test-fixture', role])
      users.push(user.insertId)
      tokens[role] = jwt.sign({ id: user.insertId, role }, process.env.JWT_SECRET, { expiresIn: '15m' })
    }
    for (let i = 0; i < 3; i++) {
      const qr = `${tag}-${i}`
      const [table] = await db.query('INSERT INTO restaurant_tables (table_number, qr_token, waiter_id) VALUES (?, ?, ?)', [crypto.randomInt(100000000, 2000000000), qr, users[2]])
      tables.push({ id: table.insertId, qr })
    }
    const category = await request('POST', '/admin/categories', { name: tag }, tokens.admin, 201)
    categoryId = category.data.id
    const created = await request('POST', '/admin/items', { category_id: categoryId, name: tag, price: 10, stock_quantity: 1 }, tokens.admin, 201)
    const itemId = created.data.id
    const modifier = await request('POST', `/admin/items/${itemId}/modifiers`, { name: 'Test modifier', price_delta: 1 }, tokens.admin, 201)
    await request('PUT', `/admin/modifiers/${modifier.data.id}`, { name: 'Updated modifier', price_delta: 2 }, tokens.admin)
    await request('PUT', `/admin/items/${itemId}`, { category_id: categoryId, name: tag, description: 'Verification fixture', price: 10, is_available: true, stock_quantity: 1 }, tokens.admin)
    console.log('PASS staff category/item/modifier writes')

    const orderBody = (table, items, extra = {}) => ({ table_id: table.id, items, payment_type: 'physical', payment_method: 'cash', ...extra })
    const line = quantity => ({ menu_item_id: itemId, quantity })
    const order = (table, items = [line(1)], extra = {}, expected = 201) => request('POST', '/orders', orderBody(table, items, extra), tokens.customer, expected, table.qr)
    // Duplicate lines with different modifiers must share one stock budget.
    await order(tables[0], [line(1), { ...line(1), modifiers: [modifier.data.id] }], {}, 400)
    let [[state]] = await db.query('SELECT stock_quantity FROM menu_items WHERE id = ?', [itemId])
    assert.equal(state.stock_quantity, 1)
    console.log('PASS repeated lines roll back without consuming stock')

    // Different tables avoid accidentally relying on the table lock for stock safety.
    const concurrent = await Promise.all(tables.slice(0, 2).map(async table => {
      const response = await fetch(base + '/orders', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${tokens.customer}`, 'x-table-token': table.qr }, body: JSON.stringify(orderBody(table, [line(1)])) })
      return { status: response.status, body: await response.json(), table }
    }))
    assert.deepEqual(concurrent.map(x => x.status).sort(), [201, 400])
    ;[[state]] = await db.query('SELECT stock_quantity FROM menu_items WHERE id = ?', [itemId])
    assert.equal(state.stock_quantity, 0)
    const winner = concurrent.find(x => x.status === 201)
    await request('PUT', `/orders/${winner.body.data.order_id}/cancel`, {}, tokens.customer)
    console.log('PASS concurrent tables cannot oversell; cancellation restores stock')

    await db.query('UPDATE menu_items SET stock_quantity = 10 WHERE id = ?', [itemId])
    const sameTable = await Promise.all(Array.from({ length: 4 }, () => order(tables[2])))
    const [[sessions]] = await db.query("SELECT COUNT(*) AS count FROM table_sessions WHERE table_id = ? AND status = 'active'", [tables[2].id])
    assert.equal(Number(sessions.count), 1)
    await assert.rejects(db.query("INSERT INTO table_sessions (table_id, session_token) VALUES (?, ?)", [tables[2].id, tag]), error => error.code === '23505')
    await request('POST', '/tables/sessions/close', { table_id: tables[2].id }, tokens.admin, 400)
    await request('PUT', `/tables/${tables[2].id}/status`, { status: 'available' }, tokens.admin, 400)
    await request('POST', `/tables/qr/${tables[2].qr}/done`, {}, tokens.customer, 400)
    console.log('PASS concurrent orders share one session; all closure routes reject active orders')

    const orderId = sameTable[0].data.order_id
    await request('POST', '/payments', { order_id: orderId, method: 'cash', payment_timing: 'post' }, tokens.customer)
    const payment = await request('GET', `/payments/order/${orderId}`, undefined, tokens.customer)
    await request('POST', `/payments/confirm/${payment.data.id}`, {}, tokens.waiter)
    let [[paid]] = await db.query('SELECT status FROM payments WHERE id = ?', [payment.data.id])
    assert.equal(paid.status, 'pending')
    await request('POST', `/payments/confirm/${payment.data.id}`, {}, tokens.cashier)
    const receipt = await fetch(base + `/receipts/${orderId}`, { headers: { authorization: `Bearer ${tokens.customer}` } })
    assert.equal(receipt.status, 200)
    assert.equal(Buffer.from(await receipt.arrayBuffer()).subarray(0, 4).toString(), '%PDF')
    await request('POST', `/payments/refund/${payment.data.id}`, { reason: 'other', notes: 'Synthetic verification payment' }, tokens.cashier)
    ;[[paid]] = await db.query('SELECT status FROM payments WHERE id = ?', [payment.data.id])
    assert.equal(paid.status, 'refunded')
    for (const entry of sameTable) await request('PUT', `/orders/${entry.data.order_id}/cancel`, {}, tokens.customer)
    await request('POST', `/tables/qr/${tables[2].qr}/done`, {}, tokens.customer)
    const [[closed]] = await db.query("SELECT COUNT(*) AS count FROM table_sessions WHERE table_id = ? AND status = 'active'", [tables[2].id])
    assert.equal(Number(closed.count), 0)
    const [[cleaning]] = await db.query("SELECT COUNT(*) AS count FROM waiter_requests WHERE table_id = ? AND type = 'cleaning'", [tables[2].id])
    assert.equal(Number(cleaning.count), 1)
    console.log('PASS waiter/cashier collection, PDF receipt, refund, customer departure and cleaning request')

    const [reward] = await db.query('INSERT INTO loyalty_rewards (name, points_cost, menu_item_id) VALUES (?, ?, ?)', [tag, 10, itemId])
    await db.query("INSERT INTO loyalty_points (user_id, points, type, description) VALUES (?, 100, 'earned', ?)", [users[0], tag])
    await db.query('UPDATE menu_items SET stock_quantity = 1 WHERE id = ?', [itemId])
    await order(tables[0], [line(1)], { redeemed_reward_id: reward.insertId }, 400)
    const rewardOrder = await order(tables[0], [], { redeemed_reward_id: reward.insertId })
    ;[[state]] = await db.query('SELECT stock_quantity FROM menu_items WHERE id = ?', [itemId])
    assert.equal(state.stock_quantity, 0)
    await order(tables[1], [], { redeemed_reward_id: reward.insertId }, 400)
    await request('PUT', `/orders/${rewardOrder.data.order_id}/cancel`, {}, tokens.customer)
    console.log('PASS reward and purchased demand share stock; reward-only stock and redemption SQL')

    // Race closure against a new order. Either closure wins and ordering opens a
    // new session, or ordering wins and closure rejects. Neither may strand an order.
    await db.query('UPDATE menu_items SET stock_quantity = 10 WHERE id = ?', [itemId])
    const closeRace = await Promise.all([
      fetch(base + '/tables/sessions/close', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${tokens.admin}` }, body: JSON.stringify({ table_id: tables[0].id }) }),
      order(tables[0])
    ])
    assert([200, 400].includes(closeRace[0].status))
    await closeRace[0].arrayBuffer()
    const [[stranded]] = await db.query("SELECT COUNT(*) AS count FROM orders o JOIN table_sessions s ON s.id = o.session_id WHERE o.table_id = ? AND o.status = 'pending' AND s.status = 'closed'", [tables[0].id])
    assert.equal(Number(stranded.count), 0)
    console.log('PASS database uniqueness and simultaneous order/session closure')

    const endpoint = `https://example.test/${tag}`
    for (const key of ['first', 'rotated']) await request('POST', '/push/subscribe', { endpoint, keys: { p256dh: key, auth: key } }, tokens.customer)
    await request('POST', '/push/unsubscribe', { endpoint }, tokens.customer)
    console.log('PASS push subscription create/update/remove (delivery not exercised)')
  } finally {
    await new Promise(resolve => server.close(resolve))
    // Drain outstanding audit writes before removing fixture-owned records.
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()
      for (const table of tables) {
        await connection.query('DELETE FROM loyalty_points WHERE order_id IN (SELECT id FROM orders WHERE table_id = ?)', [table.id])
        await connection.query('DELETE FROM orders WHERE table_id = ?', [table.id])
        await connection.query('DELETE FROM waiter_requests WHERE table_id = ?', [table.id])
        await connection.query('DELETE FROM restaurant_tables WHERE id = ?', [table.id])
      }
      if (categoryId) {
        await connection.query('DELETE FROM loyalty_rewards WHERE menu_item_id IN (SELECT id FROM menu_items WHERE category_id = ?)', [categoryId])
        await connection.query('DELETE FROM menu_categories WHERE id = ?', [categoryId])
      }
      for (const id of users) {
        await connection.query('DELETE FROM audit_log WHERE user_id = ?', [id])
        await connection.query('DELETE FROM security_events WHERE user_id = ?', [id])
        await connection.query('DELETE FROM users WHERE id = ?', [id])
      }
      await connection.commit()
      console.log('PASS fixture cleanup')
    } catch (error) {
      await connection.rollback()
      throw error
    } finally { connection.release(); await db.end() }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
