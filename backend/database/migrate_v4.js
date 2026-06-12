const statements = [
  `CREATE TABLE IF NOT EXISTS blocked_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    reason VARCHAR(255),
    blocked_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_blocked_ips_ip (ip_address)
  )`
]

module.exports = { statements }

if (require.main === module) {
  const db = require('../src/config/db')
  ;(async () => {
    for (const sql of statements) {
      const label = sql.trim().split('\n')[0].slice(0, 70)
      try {
        await db.query(sql)
        console.log('OK   ', label)
      } catch (err) {
        console.error('FAIL ', label, '-', err.message)
      }
    }
    process.exit(0)
  })()
}
