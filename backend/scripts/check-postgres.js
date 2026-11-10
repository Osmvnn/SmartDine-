const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { Pool } = require('pg')
const { connectionOptions } = require('../src/config/postgresDb')

async function main() {
  const pool = new Pool(connectionOptions())
  const client = await pool.connect()
  try {
    const { rows } = await client.query(`
      SELECT
        (SELECT count(*)::int FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS app_tables,
        (SELECT count(*)::int FROM public.users) AS users,
        (SELECT count(*)::int FROM public.orders) AS orders
    `)
    console.log(JSON.stringify({ connected: true, ...rows[0], tls: client.connection.stream.encrypted === true }))
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ connected: false, code: error.code || null, message: error.message }))
  process.exitCode = 1
})
