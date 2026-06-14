const db = require('../src/config/db')

const bcrypt = require('bcryptjs')

async function seed() {

  try {

    console.log('Seeding database...')

    const hash = await bcrypt.hash('SmartDine@2024', 10)

    await db.query(`

      INSERT IGNORE INTO users (name, email, password, role) VALUES

      ('Admin User', 'admin@smart.com', ?, 'admin'),

      ('Manager User', 'manager@smart.com', ?, 'manager'),

      ('Kitchen Staff', 'kitchen@smart.com', ?, 'kitchen'),

      ('Waiter Staff', 'waiter@smart.com', ?, 'waiter'),

      ('Cashier Staff', 'cashier@smart.com', ?, 'cashier')

    `, [hash, hash, hash, hash, hash])

    console.log('Users seeded')

    const tableValues = []

    const tableParams = []

    for (let i = 1; i <= 10; i++) {

      tableValues.push('(?, ?, ?, ?)')

      tableParams.push(i, i <= 5 ? 4 : 6, 'available', `table_${i}`)

    }

    await db.query(

      `INSERT IGNORE INTO restaurant_tables (table_number, capacity, status, qr_token) VALUES ${tableValues.join(',')}`,

      tableParams

    )

    console.log('Tables seeded')

    const [waiterRows] = await db.query(`SELECT id FROM users WHERE email = 'waiter@smart.com' LIMIT 1`)

    if (waiterRows.length) {

      await db.query(

        `UPDATE restaurant_tables SET waiter_id = ? WHERE table_number IN (1,2,3,4,5)`,

        [waiterRows[0].id]

      )

      console.log('Waiter assigned to tables 1-5')

    }

    await db.query(`

      INSERT IGNORE INTO menu_categories (id, name, description, image_url) VALUES

      (1, 'Appetizers', 'Start your meal with our delicious appetizers', '/images/appetizers.svg'),

      (2, 'Main Course', 'Hearty and satisfying main dishes', '/images/main-course.svg'),

      (3, 'Drinks', 'Refreshing beverages for every taste', '/images/drinks.svg'),

      (4, 'Desserts', 'Sweet endings to complete your meal', '/images/desserts.svg'),

      (5, 'Breakfast', 'Fresh morning plates and bakery favorites', '/images/main-course.svg'),

      (6, 'Pizza', 'Stone-baked pizzas with classic toppings', '/images/main-course.svg'),

      (7, 'Seafood', 'Fresh fish and seafood dishes', '/images/main-course.svg'),

      (8, 'Healthy Bowls', 'Balanced bowls, salads, and lighter meals', '/images/main-course.svg')

    `)

    console.log('Categories seeded')

    await db.query(`

      INSERT IGNORE INTO menu_items (id, category_id, name, description, price, image_url, is_available, prep_time_minutes, dietary_tags) VALUES

      (1, 1, 'Caesar Salad', 'Fresh romaine lettuce with parmesan and caesar dressing', 8.99, '/images/menu/1.jpg', 1, 10, 'vegetarian'),

      (2, 1, 'Chicken Wings', 'Crispy buffalo wings served with ranch dip', 10.99, '/images/menu/2.jpg', 1, 14, 'spicy'),

      (3, 1, 'Garlic Bread', 'Toasted artisan bread with garlic butter', 5.99, '/images/menu/3.jpg', 1, 8, 'vegetarian'),

      (4, 1, 'Soup of the Day', 'Chef special daily soup with bread', 6.99, '/images/menu/4.jpg', 1, 10, 'vegetarian'),

      (5, 1, 'Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 7.99, '/images/menu/5.jpg', 1, 9, 'vegetarian'),

      (6, 2, 'Grilled Chicken', 'Herb-marinated grilled chicken breast with vegetables', 15.99, '/images/menu/6.jpg', 1, 18, 'gluten-free'),

      (7, 2, 'Beef Steak', 'Premium beef steak cooked to perfection with sides', 22.99, '/images/menu/7.jpg', 1, 24, 'gluten-free'),

      (8, 2, 'Pasta Carbonara', 'Creamy Italian pasta with crispy bacon', 13.99, '/images/menu/8.jpg', 1, 16, ''),

      (9, 2, 'Fish & Chips', 'Golden battered cod with seasoned fries', 14.99, '/images/menu/9.jpg', 1, 18, ''),

      (10, 2, 'Veggie Burger', 'Plant-based burger with fresh toppings', 12.99, '/images/menu/10.jpg', 1, 15, 'vegetarian'),

      (11, 2, 'Lamb Chops', 'Tender grilled lamb chops with mint sauce', 24.99, '/images/menu/11.jpg', 1, 24, 'gluten-free'),

      (12, 3, 'Fresh Orange Juice', 'Freshly squeezed orange juice', 4.99, '/images/menu/12.jpg', 1, 4, 'vegan,gluten-free'),

      (13, 3, 'Soft Drink', 'Coca-Cola, Sprite, or Fanta', 2.99, '/images/menu/13.jpg', 1, 2, 'vegan'),

      (14, 3, 'Cappuccino', 'Italian style cappuccino', 4.49, '/images/menu/14.jpg', 1, 5, 'vegetarian'),

      (15, 3, 'Iced Tea', 'Refreshing lemon iced tea', 3.49, '/images/menu/15.jpg', 1, 3, 'vegan'),

      (16, 3, 'Mineral Water', 'Still or sparkling mineral water', 1.99, '/images/menu/16.jpg', 1, 1, 'vegan,gluten-free'),

      (17, 4, 'Chocolate Lava Cake', 'Rich chocolate cake with molten center', 8.99, '/images/menu/17.jpg', 1, 12, 'vegetarian'),

      (18, 4, 'Ice Cream Sundae', 'Three scoops with toppings and whipped cream', 6.99, '/images/menu/18.jpg', 1, 6, 'vegetarian'),

      (19, 4, 'New York Cheesecake', 'Classic New York style cheesecake', 7.99, '/images/menu/19.jpg', 1, 6, 'vegetarian'),

      (20, 4, 'Tiramisu', 'Traditional Italian tiramisu', 8.49, '/images/menu/20.jpg', 1, 6, 'vegetarian'),

      (21, 5, 'Turkish Breakfast Plate', 'Eggs, cheese, olives, tomato, cucumber, honey, and bread', 12.50, '/images/menu/21.jpg', 1, 12, 'vegetarian'),

      (22, 5, 'Avocado Toast', 'Sourdough toast with avocado, herbs, and poached egg', 9.90, '/images/menu/22.jpg', 1, 10, 'vegetarian'),

      (23, 5, 'Omelette', 'Three-egg omelette with cheese and herbs', 8.50, '/images/menu/23.jpg', 1, 8, 'vegetarian,gluten-free'),

      (24, 5, 'Pancake Stack', 'Fluffy pancakes with maple syrup and berries', 8.75, '/images/menu/24.jpg', 1, 10, 'vegetarian'),

      (25, 6, 'Margherita Pizza', 'Tomato sauce, mozzarella, and basil', 11.99, '/images/menu/25.jpg', 1, 15, 'vegetarian'),

      (26, 6, 'Pepperoni Pizza', 'Mozzarella, pepperoni, and oregano', 13.99, '/images/menu/26.jpg', 1, 16, ''),

      (27, 6, 'Chicken BBQ Pizza', 'BBQ sauce, chicken, onion, and mozzarella', 14.99, '/images/menu/27.jpg', 1, 17, ''),

      (28, 6, 'Vegetable Pizza', 'Peppers, mushrooms, onion, olives, and mozzarella', 12.99, '/images/menu/28.jpg', 1, 16, 'vegetarian'),

      (29, 7, 'Grilled Salmon', 'Salmon fillet with lemon butter and vegetables', 21.99, '/images/menu/29.jpg', 1, 20, 'gluten-free'),

      (30, 7, 'Shrimp Linguine', 'Linguine pasta with shrimp, garlic, and tomato sauce', 18.99, '/images/menu/30.jpg', 1, 18, ''),

      (31, 7, 'Sea Bass Plate', 'Pan-seared sea bass with herb potatoes', 23.50, '/images/menu/31.jpg', 1, 22, 'gluten-free'),

      (32, 7, 'Calamari', 'Crispy calamari with lemon aioli', 12.75, '/images/menu/32.jpg', 1, 12, ''),

      (33, 8, 'Chicken Quinoa Bowl', 'Quinoa, grilled chicken, avocado, greens, and tahini dressing', 14.50, '/images/menu/33.jpg', 1, 12, 'gluten-free'),

      (34, 8, 'Falafel Bowl', 'Falafel, hummus, salad, pickles, and tahini sauce', 12.50, '/images/menu/34.jpg', 1, 12, 'vegan'),

      (35, 8, 'Greek Salad Bowl', 'Feta, cucumber, tomato, olives, onion, and oregano dressing', 10.50, '/images/menu/35.jpg', 1, 8, 'vegetarian,gluten-free'),

      (36, 8, 'Vegan Power Bowl', 'Roasted vegetables, lentils, greens, and lemon dressing', 13.50, '/images/menu/36.jpg', 1, 12, 'vegan,gluten-free'),

      (37, 3, 'Mint Lemonade', 'Fresh lemon, mint, and crushed ice', 4.25, '/images/menu/37.jpg', 1, 4, 'vegan'),

      (38, 3, 'Turkish Coffee', 'Traditional strong coffee served in a small cup', 3.75, '/images/menu/38.jpg', 1, 5, 'vegan'),

      (39, 4, 'Baklava', 'Layered pastry with pistachio and syrup', 6.50, '/images/menu/39.jpg', 1, 4, 'vegetarian'),

      (40, 4, 'Fruit Plate', 'Seasonal sliced fruit', 6.00, '/images/menu/40.jpg', 1, 5, 'vegan,gluten-free')

    `)

    await db.query(`

      INSERT IGNORE INTO menu_item_modifiers (id, menu_item_id, name, price_delta) VALUES

      (1, 25, 'Extra Mozzarella', 1.50),

      (2, 26, 'Extra Pepperoni', 2.00),

      (3, 6, 'Add Mushroom Sauce', 1.25),

      (4, 8, 'Extra Parmesan', 1.00),

      (5, 14, 'Oat Milk', 0.75),

      (6, 33, 'Extra Avocado', 1.50),

      (7, 34, 'Extra Falafel', 2.00),

      (8, 29, 'Extra Vegetables', 1.75)

    `)

    await db.query(`

      INSERT IGNORE INTO loyalty_rewards (id, name, description, points_cost, menu_item_id, is_active) VALUES

      (1, 'Free Mineral Water', 'Redeem points for a bottle of mineral water', 80, 16, 1),

      (2, 'Free Dessert', 'Choose a dessert reward with your meal', 250, 39, 1),

      (3, 'Free Coffee', 'Enjoy Turkish coffee with points', 120, 38, 1)

    `)

    console.log('Menu items seeded')

    await db.query(`

      INSERT IGNORE INTO promo_codes (code, description, discount_type, discount_value, min_order, max_uses, expires_at) VALUES

      ('WELCOME10', 'Get 10% off your first order', 'percent', 10.00, 0.00, 0, '2026-12-31'),

      ('SAVE5', 'Flat $5 off orders over $30', 'fixed', 5.00, 30.00, 0, '2026-12-31'),

      ('VIP20', '20% off for loyal guests', 'percent', 20.00, 50.00, 100, '2026-12-31')

    `)

    console.log('Promo codes seeded')

    await db.query(`

      INSERT IGNORE INTO inventory_items (id, name, category, unit, quantity, min_quantity, cost_per_unit, supplier) VALUES

      (1, 'Chicken Breast', 'Meat', 'kg', 25.00, 5.00, 6.50, 'Fresh Farms Co.'),

      (2, 'Romaine Lettuce', 'Produce', 'kg', 12.00, 3.00, 1.80, 'Green Valley Produce'),

      (3, 'Beef Tenderloin', 'Meat', 'kg', 8.00, 2.00, 18.00, 'Fresh Farms Co.'),

      (4, 'Mozzarella Cheese', 'Dairy', 'kg', 10.00, 2.00, 7.20, 'Dairy Best'),

      (5, 'Spaghetti Pasta', 'Dry Goods', 'kg', 20.00, 5.00, 2.10, 'Italian Imports'),

      (6, 'Cooking Oil', 'Pantry', 'liter', 15.00, 4.00, 3.50, 'Wholesale Foods'),

      (7, 'Coffee Beans', 'Beverage', 'kg', 6.00, 2.00, 14.00, 'Roast Masters'),

      (8, 'Soft Drink Syrup', 'Beverage', 'liter', 4.00, 2.00, 9.00, 'Beverage Supply Inc.')

    `)

    console.log('Inventory seeded')

    console.log('\nDatabase seeded successfully!')

    console.log('\nDefault staff accounts (change passwords after first login):')

    console.log('  Admin:   admin@smart.com')

    console.log('  Manager: manager@smart.com')

    console.log('  Kitchen: kitchen@smart.com')

    console.log('  Waiter:  waiter@smart.com')

    console.log('  Cashier: cashier@smart.com')

    process.exit(0)

  } catch (error) {

    console.error('Seeding failed:', error.message)

    process.exit(1)

  }

}

seed()
