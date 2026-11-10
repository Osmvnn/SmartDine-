const { test } = require('node:test')
const assert = require('node:assert/strict')
const { bindParameters, createDatabase, prepareQuery } = require('../src/config/postgresDb')

test('binds only SQL placeholders, preserving quoted question marks and comments', () => {
  const sql = "SELECT '?' AS literal, name FROM users WHERE id = ? -- ? ignored\nAND email = ? /* ? ignored */"
  assert.equal(
    bindParameters(sql, [3, 'user@example.test']),
    "SELECT '?' AS literal, name FROM users WHERE id = $1 -- ? ignored\nAND email = $2 /* ? ignored */"
  )
  assert.throws(() => bindParameters('SELECT ? + ?', [1]), /parameter mismatch/)
})

test('adds RETURNING id to inserts and preserves mysql2 result shape', async () => {
  const calls = []
  const pool = {
    async query(sql, values) {
      calls.push({ sql, values })
      return { command: 'INSERT', rows: [{ id: 42 }], rowCount: 1, fields: [] }
    }
  }
  const db = createDatabase(pool)
  const [result] = await db.query('INSERT INTO users (name) VALUES (?)', ['Demo'])
  assert.equal(result.insertId, 42)
  assert.equal(result.affectedRows, 1)
  assert.deepEqual(calls, [{ sql: 'INSERT INTO users (name) VALUES ($1) RETURNING id', values: ['Demo'] }])
  assert.equal(prepareQuery('INSERT INTO users (name) VALUES (?) RETURNING id', ['Demo']).sql,
    'INSERT INTO users (name) VALUES ($1) RETURNING id')
})

test('uses one client for a transaction and releases it', async () => {
  const calls = []
  let released = false
  const client = {
    async query(sql, values) {
      calls.push([sql, values])
      return sql === 'SELECT $1 AS id'
        ? { command: 'SELECT', rows: [{ id: 7 }], rowCount: 1, fields: [] }
        : { command: sql, rows: [], rowCount: 0, fields: [] }
    },
    release() { released = true }
  }
  const db = createDatabase({ async connect() { return client } })
  const connection = await db.getConnection()
  await connection.beginTransaction()
  const [rows] = await connection.query('SELECT ? AS id', [7])
  await connection.commit()
  connection.release()
  assert.deepEqual(rows, [{ id: 7 }])
  assert.deepEqual(calls.map(([sql]) => sql), ['BEGIN', 'SELECT $1 AS id', 'COMMIT'])
  assert.equal(released, true)
})
