const { Pool, types } = require('pg')
const fs = require('fs')

// mysql2 returns numbers for COUNT and DECIMAL in this project. Keep the
// existing controller/API behavior while the SQL queries are migrated.
types.setTypeParser(types.builtins.INT8, Number)
types.setTypeParser(types.builtins.NUMERIC, Number)

function bindParameters(sql, values = []) {
  let result = ''
  let index = 0
  let quote = null
  let lineComment = false
  let blockComment = false

  for (let i = 0; i < sql.length; i++) {
    const current = sql[i]
    const next = sql[i + 1]

    if (lineComment) {
      result += current
      if (current === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      result += current
      if (current === '*' && next === '/') {
        result += '/'
        i++
        blockComment = false
      }
      continue
    }
    if (quote) {
      result += current
      if (current === quote) {
        if (next === quote) {
          result += next
          i++
        } else {
          quote = null
        }
      }
      continue
    }
    if (current === '-' && next === '-') {
      result += '--'
      i++
      lineComment = true
      continue
    }
    if (current === '/' && next === '*') {
      result += '/*'
      i++
      blockComment = true
      continue
    }
    if (current === "'" || current === '"') {
      result += current
      quote = current
      continue
    }
    if (current === '?') {
      result += `$${++index}`
      continue
    }
    result += current
  }

  if (index !== values.length) {
    throw new Error(`SQL parameter mismatch: ${index} placeholders, ${values.length} values`)
  }
  return result
}

function prepareQuery(sql, values) {
  let prepared = bindParameters(sql, values)
  const insert = /^\s*INSERT\s+INTO\b/i.test(prepared)
  if (insert && !/\bRETURNING\b/i.test(prepared)) {
    prepared = prepared.trim().replace(/;$/, '') + ' RETURNING id'
  }
  return { sql: prepared, insert }
}

function mysqlStyleResult(result, insert) {
  if (result.command === 'SELECT' || result.command === 'SHOW') return [result.rows, result.fields]
  return [{ affectedRows: result.rowCount, insertId: insert ? result.rows[0]?.id : undefined }, result.fields]
}

function connectionOptions() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when DB_PROVIDER=postgres')
  }
  const url = new URL(process.env.DATABASE_URL)
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string')
  }
  const ssl = process.env.DB_SSL === 'false'
    ? false
    : process.env.DB_SSL_CA_FILE
      ? { ca: fs.readFileSync(process.env.DB_SSL_CA_FILE, 'utf8'), rejectUnauthorized: true }
      : { rejectUnauthorized: false }
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    ssl,
    max: 10,
    connectionTimeoutMillis: 10000
  }
}

function createDatabase(pool = new Pool(connectionOptions())) {
  async function queryWith(client, sql, values = []) {
    const prepared = prepareQuery(sql, values)
    const result = await client.query(prepared.sql, values)
    return mysqlStyleResult(result, prepared.insert)
  }

  return {
    query(sql, values) { return queryWith(pool, sql, values) },
    async getConnection() {
      const client = await pool.connect()
      return {
        query(sql, values) { return queryWith(client, sql, values) },
        beginTransaction() { return client.query('BEGIN') },
        commit() { return client.query('COMMIT') },
        rollback() { return client.query('ROLLBACK') },
        release() { client.release() }
      }
    },
    end() { return pool.end() }
  }
}

module.exports = { createDatabase, bindParameters, prepareQuery, connectionOptions }
