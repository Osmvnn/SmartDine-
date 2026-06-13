CREATE DATABASE IF NOT EXISTS smart_restaurant;
USE smart_restaurant;

DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS waiter_requests;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS loyalty_points;
DROP TABLE IF EXISTS loyalty_rewards;
DROP TABLE IF EXISTS menu_item_modifiers;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS push_subscriptions;
DROP TABLE IF EXISTS promo_codes;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS table_sessions;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS menu_categories;
DROP TABLE IF EXISTS restaurant_tables;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','manager','waiter','kitchen','cashier','customer') DEFAULT 'customer',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE restaurant_tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number INT UNIQUE NOT NULL,
  capacity INT DEFAULT 4,
  status ENUM('available','occupied','reserved') DEFAULT 'available',
  qr_token VARCHAR(100) UNIQUE NOT NULL,
  waiter_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (waiter_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE table_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  status ENUM('active','closed') DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE
);

CREATE TABLE menu_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255),
  is_available TINYINT(1) DEFAULT 1,
  stock_quantity INT DEFAULT -1,
  prep_time_minutes INT DEFAULT 15,
  dietary_tags VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);

CREATE TABLE menu_item_modifiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price_delta DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE TABLE promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  discount_type ENUM('percent','fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) DEFAULT 0.00,
  max_uses INT DEFAULT 0,
  used_count INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  expires_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  session_id INT,
  customer_id INT,
  status ENUM('pending','confirmed','preparing','ready','served','completed','cancelled') DEFAULT 'pending',
  total DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  promo_code_id INT,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_type ENUM('online','physical') DEFAULT 'online',
  estimated_ready_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
  FOREIGN KEY (session_id) REFERENCES table_sessions(id),
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity INT DEFAULT 1,
  notes TEXT,
  price DECIMAL(10,2) NOT NULL,
  status ENUM('pending','preparing','ready','served') DEFAULT 'pending',
  modifiers TEXT NULL,
  modifier_total DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('card','cash','mobile') DEFAULT 'card',
  payment_timing ENUM('pre','post') DEFAULT 'pre',
  split_type ENUM('full','equal','custom') DEFAULT 'full',
  payer_name VARCHAR(100),
  status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  tip_amount DECIMAL(10,2) DEFAULT 0.00,
  cashier_confirmed TINYINT(1) DEFAULT 0,
  confirmed_by INT,
  confirmed_at TIMESTAMP NULL,
  waiter_confirmed_by INT,
  waiter_confirmed_at TIMESTAMP NULL,
  refund_reason VARCHAR(255) NULL,
  refunded_by INT NULL,
  refunded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (waiter_confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (refunded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE waiter_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  type ENUM('help','water','salt','cleaning','complaint','bill') NOT NULL,
  status ENUM('pending','handled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
);

CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  menu_item_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE TABLE ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  table_id INT,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INT DEFAULT 2,
  status ENUM('pending','confirmed','cancelled','completed','no_show') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE loyalty_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  user_id INT,
  points INT NOT NULL,
  type ENUM('earned','redeemed') NOT NULL,
  order_id INT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE loyalty_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  points_cost INT NOT NULL,
  menu_item_id INT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_name VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  session_id INT NULL,
  endpoint VARCHAR(500) NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_endpoint (endpoint(255))
);

CREATE TABLE shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  clock_in TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  clock_out TIMESTAMP NULL,
  note TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  unit VARCHAR(50) DEFAULT 'pcs',
  quantity DECIMAL(10,2) DEFAULT 0.00,
  min_quantity DECIMAL(10,2) DEFAULT 5.00,
  cost_per_unit DECIMAL(10,2) DEFAULT 0.00,
  supplier VARCHAR(150),
  notes TEXT,
  last_restocked TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE security_events (
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
);
