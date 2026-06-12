const statements = [
  `ALTER TABLE users MODIFY COLUMN role ENUM('admin','manager','waiter','kitchen','cashier','customer') DEFAULT 'customer'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_type ENUM('online','physical') DEFAULT 'online'`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_timing ENUM('pre','post') DEFAULT 'pre'`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS cashier_confirmed TINYINT(1) DEFAULT 0`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_by INT NULL`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP NULL`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS waiter_confirmed_by INT NULL`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS waiter_confirmed_at TIMESTAMP NULL`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0.00`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(255) NULL`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_by INT NULL`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP NULL`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status ENUM('pending','preparing','ready','served') DEFAULT 'pending'`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS modifiers TEXT NULL`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS modifier_total DECIMAL(10,2) DEFAULT 0.00`,
  `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS prep_time_minutes INT DEFAULT 15`,
  `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS dietary_tags VARCHAR(255) NULL`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMP NULL`,
  `CREATE TABLE IF NOT EXISTS menu_item_modifiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price_delta DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    points_cost INT NOT NULL,
    menu_item_id INT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_name VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    session_id INT NULL,
    endpoint VARCHAR(500) NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_endpoint (endpoint(255))
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
