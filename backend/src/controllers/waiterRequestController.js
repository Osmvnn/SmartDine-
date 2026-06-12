const db = require('../config/db')
const { transitionOrderStatus } = require('../services/orderWorkflow')

exports.createWaiterRequest = async (req, res) => {

  try {

    const { table_id, type } = req.body

    const allowedTypes = ['help', 'water', 'salt', 'cleaning', 'complaint']

    if (!table_id || !allowedTypes.includes(type)) {

      return res.status(400).json({

        success: false,

        message: 'Valid table_id and type are required'

      })

    }

    const [result] = await db.query(

      'INSERT INTO waiter_requests (table_id, type, status) VALUES (?, ?, "pending")',

      [table_id, type]

    )

    try {

      const { getIO } = require('../socket')

      const io = getIO()

      if (io) {

        io.to('waiter').emit('new-waiter-request', { id: result.insertId, table_id, type })

      }

    } catch { }

    res.status(201).json({

      success: true,

      message: 'Waiter request created successfully',

      data: {

        id: result.insertId

      }

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Failed to create waiter request',

      error: error.message

    })

  }

}

exports.getWaiterRequests = async (req, res) => {

  try {

    let query = `

      SELECT 

        waiter_requests.*,

        restaurant_tables.table_number

      FROM waiter_requests

      LEFT JOIN restaurant_tables 

        ON waiter_requests.table_id = restaurant_tables.id

    `

    const params = []

    if (req.user && req.user.role === 'waiter') {

      query += ' WHERE restaurant_tables.waiter_id = ?'

      params.push(req.user.id)

    }

    query += ' ORDER BY waiter_requests.created_at DESC'

    const [rows] = await db.query(query, params)

    res.json({

      success: true,

      data: rows

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Failed to fetch waiter requests',

      error: error.message

    })

  }

}

exports.getWaiterOrders = async (req, res) => {

  try {

    let query = `

      SELECT orders.*, restaurant_tables.table_number

      FROM orders

      LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id

      WHERE orders.status IN ('ready', 'served')

    `

    const params = []

    if (req.user && req.user.role === 'waiter') {

      query += ' AND restaurant_tables.waiter_id = ?'

      params.push(req.user.id)

    }

    query += ` ORDER BY FIELD(orders.status, 'ready', 'served'), orders.created_at ASC`

    const [orders] = await db.query(query, params)

    for (const order of orders) {

      const [items] = await db.query(`

        SELECT order_items.*, menu_items.name

        FROM order_items

        LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id

        WHERE order_items.order_id = ?

      `, [order.id])

      order.items = items

    }

    res.json({ success: true, data: orders })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.updateOrderStatus = async (req, res) => {

  try {

    const { id } = req.params

    const { status } = req.body

    await transitionOrderStatus(id, status, { role: req.user.role })

    res.json({ success: true, message: `Order status updated to ${status}` })

  } catch (error) {

    res.status(error.statusCode || 500).json({ success: false, message: error.message })

  }

}

exports.markHandled = async (req, res) => {

  try {

    const { id } = req.params

    const [result] = await db.query(

      'UPDATE waiter_requests SET status = "handled" WHERE id = ?',

      [id]

    )

    if (!result.affectedRows) {

      return res.status(404).json({

        success: false,

        message: 'Waiter request not found'

      })

    }

    res.json({

      success: true,

      message: 'Waiter request marked as handled'

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Failed to update waiter request',

      error: error.message

    })

  }

}
