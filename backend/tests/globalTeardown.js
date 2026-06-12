const path = require('path')
const mysql = require('mysql2/promise')

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const TEST_DB = process.env.TEST_DB_NAME || 'smart_restaurant_test'

module.exports = async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: 3306
  })
  await conn.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``)
  await conn.end()
}
