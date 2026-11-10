const db = require('../config/db')
const { dateText, daysBeforeToday } = require('../config/reportSql')

const bcrypt = require('bcryptjs')

const multer = require('multer')

const path = require('path')

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, path.join(__dirname, '..', '..', 'uploads'))

  },

  filename: (req, file, cb) => {

    const ext = path.extname(file.originalname)

    cb(null, `item_${Date.now()}${ext}`)

  }

})

const upload = multer({

  storage,

  limits: { fileSize: 5 * 1024 * 1024 },

  fileFilter: (req, file, cb) => {

    const allowed = /jpeg|jpg|png|gif|webp/

    const ext = allowed.test(path.extname(file.originalname).toLowerCase())

    const mime = allowed.test(file.mimetype)

    if (ext && mime) return cb(null, true)

    cb(new Error('Only image files are allowed'))

  }

})

exports.upload = upload

const PAID_ORDER_FILTER = `orders.status NOT IN ('cancelled') AND EXISTS (
  SELECT 1 FROM payments
  WHERE payments.order_id = orders.id
  AND payments.status = 'paid'
)`

const USER_ROLES = ['admin', 'manager', 'waiter', 'kitchen', 'cashier', 'customer']

exports.getStats = async (req, res) => {

  try {

    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as "totalUsers" FROM users')

    const [[{ totalTables }]] = await db.query('SELECT COUNT(*) as "totalTables" FROM restaurant_tables')

    const [[{ totalItems }]] = await db.query('SELECT COUNT(*) as "totalItems" FROM menu_items')

    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as "totalOrders" FROM orders')

    const [[{ totalRevenue }]] = await db.query(

      `SELECT COALESCE(SUM(total), 0) as "totalRevenue" FROM orders WHERE ${PAID_ORDER_FILTER}`

    )

    const [[{ pendingOrders }]] = await db.query(

      `SELECT COUNT(*) as "pendingOrders" FROM orders WHERE status IN ('pending', 'confirmed')`

    )

    const [[{ totalCategories }]] = await db.query('SELECT COUNT(*) as "totalCategories" FROM menu_categories')

    res.json({

      success: true,

      data: { totalUsers, totalTables, totalItems, totalOrders, totalRevenue, pendingOrders, totalCategories }

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getUsers = async (req, res) => {

  try {

    const page = Math.max(1, parseInt(req.query.page) || 1)

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

    const offset = (page - 1) * limit

    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM users')

    const [rows] = await db.query(

      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id ASC LIMIT ? OFFSET ?',

      [limit, offset]

    )

    res.json({ success: true, data: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.createUser = async (req, res) => {

  try {

    const { name, email, password, role } = req.body

    if (!name || !email || !password) {

      return res.status(400).json({ success: false, message: 'Name, email, and password are required' })

    }

    const selectedRole = USER_ROLES.includes(role) ? role : 'customer'

    const hash = await bcrypt.hash(password, 10)

    const [result] = await db.query(

      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',

      [name, email, hash, selectedRole]

    )

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'User created' })

  } catch (error) {

    if (error.code === 'ER_DUP_ENTRY') {

      return res.status(400).json({ success: false, message: 'Email already exists' })

    }

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.updateUser = async (req, res) => {

  try {

    const { id } = req.params

    const { name, email, role, is_active } = req.body

    if (!USER_ROLES.includes(role)) {

      return res.status(400).json({ success: false, message: 'Invalid user role' })

    }

    const [result] = await db.query(

      'UPDATE users SET name = ?, email = ?, role = ?, is_active = ? WHERE id = ?',

      [name, email, role, is_active !== undefined ? is_active : 1, id]

    )

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found' })

    res.json({ success: true, message: 'User updated' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.deleteUser = async (req, res) => {

  try {

    const { id } = req.params

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id])

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found' })

    res.json({ success: true, message: 'User deleted' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getCategories = async (req, res) => {

  try {

    const [rows] = await db.query('SELECT * FROM menu_categories ORDER BY id ASC')

    res.json({ success: true, data: rows })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.createCategory = async (req, res) => {

  try {

    const { name, description } = req.body

    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' })

    const [result] = await db.query(

      'INSERT INTO menu_categories (name, description) VALUES (?, ?)',

      [name, description || null]

    )

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Category created' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.updateCategory = async (req, res) => {

  try {

    const { id } = req.params

    const { name, description } = req.body

    const [result] = await db.query(

      'UPDATE menu_categories SET name = ?, description = ? WHERE id = ?',

      [name, description, id]

    )

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Category not found' })

    res.json({ success: true, message: 'Category updated' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.deleteCategory = async (req, res) => {

  try {

    const { id } = req.params

    const [result] = await db.query('DELETE FROM menu_categories WHERE id = ?', [id])

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Category not found' })

    res.json({ success: true, message: 'Category deleted' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getItems = async (req, res) => {

  try {

    const page = Math.max(1, parseInt(req.query.page) || 1)

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

    const offset = (page - 1) * limit

    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM menu_items')

    const [rows] = await db.query(`

      SELECT menu_items.*, menu_categories.name as category_name

      FROM menu_items

      LEFT JOIN menu_categories ON menu_items.category_id = menu_categories.id

      ORDER BY menu_items.id ASC

      LIMIT ? OFFSET ?

    `, [limit, offset])

    res.json({ success: true, data: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.createItem = async (req, res) => {

  try {

    const { category_id, name, description, price, is_available, stock_quantity, dietary_tags } = req.body

    if (!category_id || !name || !price) {

      return res.status(400).json({ success: false, message: 'category_id, name, and price are required' })

    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null

    const [result] = await db.query(

      'INSERT INTO menu_items (category_id, name, description, price, is_available, stock_quantity, image_url, dietary_tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',

      [category_id, name, description || null, price, is_available !== undefined ? is_available : 1, stock_quantity !== undefined ? stock_quantity : -1, image_url, dietary_tags || null]

    )

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Item created' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.updateItem = async (req, res) => {

  try {

    const { id } = req.params

    const { category_id, name, description, price, is_available, stock_quantity, dietary_tags } = req.body

    const image_url = req.file ? `/uploads/${req.file.filename}` : undefined

    let query, params

    if (image_url) {

      query = 'UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, is_available = ?, stock_quantity = ?, image_url = ?, dietary_tags = ? WHERE id = ?'

      params = [category_id, name, description, price, is_available, stock_quantity !== undefined ? stock_quantity : -1, image_url, dietary_tags || null, id]

    } else {

      query = 'UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, is_available = ?, stock_quantity = ?, dietary_tags = ? WHERE id = ?'

      params = [category_id, name, description, price, is_available, stock_quantity !== undefined ? stock_quantity : -1, dietary_tags || null, id]

    }

    const [result] = await db.query(query, params)

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Item not found' })

    res.json({ success: true, message: 'Item updated' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.deleteItem = async (req, res) => {

  try {

    const { id } = req.params

    const [result] = await db.query('DELETE FROM menu_items WHERE id = ?', [id])

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Item not found' })

    res.json({ success: true, message: 'Item deleted' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getModifiers = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await db.query('SELECT * FROM menu_item_modifiers WHERE menu_item_id = ? ORDER BY id ASC', [id])
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.createModifier = async (req, res) => {
  try {
    const { id } = req.params
    const { name, price_delta } = req.body
    if (!name) return res.status(400).json({ success: false, message: 'name is required' })
    const [result] = await db.query(
      'INSERT INTO menu_item_modifiers (menu_item_id, name, price_delta) VALUES (?, ?, ?)',
      [id, name, price_delta || 0]
    )
    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Modifier created' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateModifier = async (req, res) => {
  try {
    const { modifierId } = req.params
    const { name, price_delta } = req.body
    const [result] = await db.query(
      'UPDATE menu_item_modifiers SET name = ?, price_delta = ? WHERE id = ?',
      [name, price_delta || 0, modifierId]
    )
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Modifier not found' })
    res.json({ success: true, message: 'Modifier updated' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.deleteModifier = async (req, res) => {
  try {
    const { modifierId } = req.params
    const [result] = await db.query('DELETE FROM menu_item_modifiers WHERE id = ?', [modifierId])
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Modifier not found' })
    res.json({ success: true, message: 'Modifier deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getTables = async (req, res) => {

  try {

    const [rows] = await db.query(`

      SELECT restaurant_tables.*, users.name as waiter_name 

      FROM restaurant_tables 

      LEFT JOIN users ON restaurant_tables.waiter_id = users.id 

      ORDER BY table_number ASC

    `)

    res.json({ success: true, data: rows })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.createTable = async (req, res) => {

  try {

    const { table_number, capacity } = req.body

    if (!table_number) return res.status(400).json({ success: false, message: 'table_number is required' })

    const qr_token = `table_${table_number}`

    const [result] = await db.query(

      'INSERT INTO restaurant_tables (table_number, capacity, qr_token) VALUES (?, ?, ?)',

      [table_number, capacity || 4, qr_token]

    )

    res.status(201).json({ success: true, data: { id: result.insertId, qr_token }, message: 'Table created' })

  } catch (error) {

    if (error.code === 'ER_DUP_ENTRY') {

      return res.status(400).json({ success: false, message: 'Table number already exists' })

    }

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.updateTable = async (req, res) => {

  try {

    const { id } = req.params

    const { table_number, capacity, status } = req.body

    const qr_token = `table_${table_number}`

    const [result] = await db.query(

      'UPDATE restaurant_tables SET table_number = ?, capacity = ?, status = ?, qr_token = ? WHERE id = ?',

      [table_number, capacity, status || 'available', qr_token, id]

    )

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Table not found' })

    res.json({ success: true, message: 'Table updated' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.deleteTable = async (req, res) => {

  try {

    const { id } = req.params

    const [result] = await db.query('DELETE FROM restaurant_tables WHERE id = ?', [id])

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Table not found' })

    res.json({ success: true, message: 'Table deleted' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getWaiters = async (req, res) => {

  try {

    const [rows] = await db.query(

      `SELECT id, name, email FROM users WHERE role = 'waiter' AND is_active = TRUE`

    )

    for (const waiter of rows) {

      const [[{ count }]] = await db.query(

        'SELECT COUNT(*) as count FROM restaurant_tables WHERE waiter_id = ?',

        [waiter.id]

      )

      waiter.table_count = count

    }

    res.json({ success: true, data: rows })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.assignWaiter = async (req, res) => {

  try {

    const { id } = req.params

    const { waiter_id } = req.body

    if (waiter_id) {

      const [waiterRows] = await db.query(

        `SELECT id FROM users WHERE id = ? AND role = 'waiter' AND is_active = TRUE`,

        [waiter_id]

      )

      if (!waiterRows.length) {

        return res.status(400).json({ success: false, message: 'Waiter not found' })

      }

      const [[{ count }]] = await db.query(

        'SELECT COUNT(*) as count FROM restaurant_tables WHERE waiter_id = ? AND id != ?',

        [waiter_id, id]

      )

      if (count >= 5) {

        return res.status(400).json({ success: false, message: 'Waiter already handles 5 tables (maximum)' })

      }

    }

    const [result] = await db.query(

      'UPDATE restaurant_tables SET waiter_id = ? WHERE id = ?',

      [waiter_id || null, id]

    )

    if (!result.affectedRows) {

      return res.status(404).json({ success: false, message: 'Table not found' })

    }

    res.json({ success: true, message: waiter_id ? 'Waiter assigned' : 'Waiter unassigned' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getAllOrders = async (req, res) => {

  try {

    const page = Math.max(1, parseInt(req.query.page) || 1)

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

    const offset = (page - 1) * limit

    const statusFilter = req.query.status

    const dateFilter = req.query.date || null

    const conditions = []

    const params = []

    if (statusFilter) {

      conditions.push('orders.status = ?')

      params.push(statusFilter)

    }

    if (dateFilter) {

      conditions.push('DATE(orders.created_at) = ?')

      params.push(dateFilter)

    }

    const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''

    const countQuery = `SELECT COUNT(*) as total FROM orders${whereClause}`

    let dataQuery = `SELECT orders.*, restaurant_tables.table_number FROM orders LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id${whereClause}`

    dataQuery += ' ORDER BY orders.created_at DESC LIMIT ? OFFSET ?'

    const [[{ total }]] = await db.query(countQuery, params)

    const [orders] = await db.query(dataQuery, [...params, limit, offset])

    for (const order of orders) {

      const [items] = await db.query(`

        SELECT order_items.*, menu_items.name

        FROM order_items

        LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id

        WHERE order_items.order_id = ?

      `, [order.id])

      order.items = items

    }

    res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getOrdersHistory = async (req, res) => {

  try {

    const days = Math.min(Math.max(parseInt(req.query.days) || 14, 1), 60)

    const [rows] = await db.query(`

      SELECT

        ${dateText('created_at')} as date,

        COUNT(*) as order_count,

        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as revenue

      FROM orders

      WHERE created_at >= ${daysBeforeToday}

      GROUP BY ${dateText('created_at')}

      ORDER BY date DESC

    `, [days])

    res.json({

      success: true,

      data: rows.map(r => ({ ...r, revenue: Number(r.revenue) }))

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getLoyaltyRewards = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT loyalty_rewards.*, menu_items.name as item_name, menu_items.price as item_price
      FROM loyalty_rewards
      LEFT JOIN menu_items ON loyalty_rewards.menu_item_id = menu_items.id
      ORDER BY loyalty_rewards.points_cost ASC
    `)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.createLoyaltyReward = async (req, res) => {
  try {
    const { name, description, points_cost, menu_item_id, is_active } = req.body
    if (!name || !points_cost) {
      return res.status(400).json({ success: false, message: 'name and points_cost are required' })
    }
    const [result] = await db.query(
      'INSERT INTO loyalty_rewards (name, description, points_cost, menu_item_id, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, points_cost, menu_item_id || null, is_active === undefined ? 1 : (is_active ? 1 : 0)]
    )
    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Reward created' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateLoyaltyReward = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, points_cost, menu_item_id, is_active } = req.body
    const [result] = await db.query(
      'UPDATE loyalty_rewards SET name = ?, description = ?, points_cost = ?, menu_item_id = ?, is_active = ? WHERE id = ?',
      [name, description || null, points_cost, menu_item_id || null, is_active ? 1 : 0, id]
    )
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Reward not found' })
    res.json({ success: true, message: 'Reward updated' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.deleteLoyaltyReward = async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await db.query('DELETE FROM loyalty_rewards WHERE id = ?', [id])
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Reward not found' })
    res.json({ success: true, message: 'Reward deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAuditLog = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit

    const { entity_type, action, user_id } = req.query

    const where = []
    const params = []
    if (entity_type) { where.push('entity_type = ?'); params.push(entity_type) }
    if (action) { where.push('action = ?'); params.push(action) }
    if (user_id) { where.push('user_id = ?'); params.push(user_id) }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM audit_log ${whereClause}`, params)
    const [rows] = await db.query(
      `SELECT * FROM audit_log ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    const [entityTypes] = await db.query('SELECT DISTINCT entity_type FROM audit_log ORDER BY entity_type')

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      entityTypes: entityTypes.map(r => r.entity_type)
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
