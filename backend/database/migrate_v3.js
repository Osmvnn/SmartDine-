const statements = [
  `CREATE TABLE IF NOT EXISTS security_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    email VARCHAR(150) NULL,
    user_id INT NULL,
    path VARCHAR(255),
    method VARCHAR(10),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_security_events_created (created_at),
    INDEX idx_security_events_ip (ip_address),
    INDEX idx_security_events_type (event_type)
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
