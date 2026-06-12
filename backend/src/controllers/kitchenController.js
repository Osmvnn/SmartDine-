const db = require('../config/db')
const { transitionOrderStatus, transitionOrderItemStatus } = require('../services/orderWorkflow')

exports.getKitchenOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT orders.*, restaurant_tables.table_number
      FROM orders
      LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id
      WHERE orders.status IN ('confirmed', 'preparing', 'ready')
      ORDER BY
        FIELD(orders.status, 'confirmed', 'preparing', 'ready'),
        orders.created_at ASC
    `)

    for (const order of orders) {
      const [items] = await db.query(`
        SELECT order_items.*, menu_items.name
        FROM order_items
        LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id
        WHERE order_items.order_id = ?
      `, [order.id])

      for (const item of items) {
        if (item.modifiers) {
          try { item.modifiers = JSON.parse(item.modifiers) } catch { item.modifiers = [] }
        } else {
          item.modifiers = []
        }
      }

      order.items = items
    }

    res.json({ success: true, data: orders })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateKitchenOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    await transitionOrderStatus(id, status, { role: req.user.role })

    res.json({ success: true, message: `Order status updated to ${status}` })
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}

exports.updateOrderItemStatus = async (req, res) => {
  try {
    const { id, itemId } = req.params
    const { status } = req.body

    await transitionOrderItemStatus(id, itemId, status, { role: req.user.role })

    res.json({ success: true, message: `Item status updated to ${status}` })
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
}
