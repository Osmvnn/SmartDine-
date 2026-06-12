const mysql = require('mysql2')

const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const pool = mysql.createPool({

  host: process.env.DB_HOST || 'localhost',

  user: process.env.DB_USER || 'root',

  password: process.env.DB_PASSWORD || '',

  database: process.env.DB_NAME || 'smart_restaurant',

  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,

  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined

})

module.exports = pool.promise()