const statements = [
  `ALTER TABLE waiter_requests
    MODIFY type ENUM('help','water','salt','cleaning','complaint','bill') NOT NULL`,

  `ALTER TABLE reservations
    ADD COLUMN user_id INT NULL AFTER id`,

  `ALTER TABLE reservations
    ADD CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
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
