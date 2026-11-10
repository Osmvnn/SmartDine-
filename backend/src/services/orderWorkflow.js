const db = require('../config/db')

const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['served'],
  served: ['completed'],
  completed: [],
  cancelled: []
}

const ROLE_ALLOWED_TARGETS = {
  admin: Object.keys(ALLOWED_TRANSITIONS),
  manager: Object.keys(ALLOWED_TRANSITIONS),
  kitchen: ['preparing', 'ready'],
  waiter: ['served', 'completed'],
  cashier: ['completed']
}

async function emitOrderStatus(orderId, status) {
  try {
    const { getIO } = require('../socket')
    const io = getIO()
    if (!io) return

    await require('../socket').emitOrderEvent(orderId, 'order-status-changed', { order_id: Number(orderId), status })

    if (status === 'ready') {
      io.to('waiter').emit('order-ready', { order_id: Number(orderId) })
    }
  } catch { }
}

async function transitionOrderStatus(orderId, nextStatus, options = {}) {
  if (nextStatus === 'cancelled' || (nextStatus === 'confirmed' && !options.connection)) {
    throw Object.assign(new Error('Use the cancellation or payment endpoint for this transition'), { statusCode: 409 })
  }
  const connection = options.connection || db
  const role = options.role || 'admin'
  const roleTargets = ROLE_ALLOWED_TARGETS[role] || []

  if (!ALLOWED_TRANSITIONS.hasOwnProperty(nextStatus)) {
    const error = new Error(`Invalid order status: ${nextStatus}`)
    error.statusCode = 400
    throw error
  }

  if (!roleTargets.includes(nextStatus)) {
    const error = new Error(`Role "${role}" cannot set order status to "${nextStatus}"`)
    error.statusCode = 403
    throw error
  }

  const [orders] = await connection.query(
    'SELECT id, status, table_id, session_id, customer_id, total FROM orders WHERE id = ? LIMIT 1',
    [orderId]
  )

  if (!orders.length) {
    const error = new Error('Order not found')
    error.statusCode = 404
    throw error
  }

  const order = orders[0]
  if (nextStatus === 'completed') {
    const [[balance]] = await connection.query(
      "SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN amount - tip_amount ELSE 0 END), 0) AS paid, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending FROM payments WHERE order_id = ?", [orderId])
    if (Number(balance.pending) > 0 || Math.round(Number(balance.paid) * 100) < Math.round(Number(order.total) * 100)) {
      throw Object.assign(new Error('Outstanding payments must be settled before completion'), { statusCode: 409 })
    }
  }
  const allowedNext = ALLOWED_TRANSITIONS[order.status] || []

  if (!allowedNext.includes(nextStatus)) {
    const error = new Error(
      `Cannot transition order from "${order.status}" to "${nextStatus}". Allowed: ${allowedNext.join(', ') || 'none'}`
    )
    error.statusCode = 400
    throw error
  }

  await connection.query(
    'UPDATE orders SET status = ? WHERE id = ?',
    [nextStatus, orderId]
  )

  if (nextStatus === 'confirmed') {
    const [[{ maxPrep }]] = await connection.query(
      `SELECT COALESCE(MAX(mi.prep_time_minutes), 15) as "maxPrep"
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [orderId]
    )
    await connection.query(
      process.env.DB_PROVIDER === 'postgres'
        ? "UPDATE orders SET estimated_ready_at = NOW() + (? * INTERVAL '1 minute') WHERE id = ?"
        : 'UPDATE orders SET estimated_ready_at = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
      [maxPrep, orderId]
    )
  }

  await connection.query(
    'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
    [orderId, nextStatus]
  )
  if (nextStatus === 'preparing') {
    await connection.query(
      `UPDATE order_items SET status = 'preparing' WHERE order_id = ? AND status = 'pending'`,
      [orderId]
    )
  } else if (nextStatus === 'ready') {
    await connection.query(
      `UPDATE order_items SET status = 'ready' WHERE order_id = ? AND status IN ('pending', 'preparing')`,
      [orderId]
    )
  } else if (nextStatus === 'served') {
    await connection.query(
      `UPDATE order_items SET status = 'served' WHERE order_id = ? AND status != 'served'`,
      [orderId]
    )
  }

  if (options.emit !== false) {
    await emitOrderStatus(orderId, nextStatus)
  }

  if (nextStatus === 'ready') {
    require('./pushService').notifyUser(order.customer_id, {
      title: 'Order Ready',
      body: `Your order #${orderId} is ready to be served.`,
      tag: `order-${orderId}`,
      url: `/customer/order/${orderId}`
    }).catch(() => {})
  }

  return { ...order, previous_status: order.status, status: nextStatus }
}

const ITEM_ALLOWED_TRANSITIONS = {
  pending: ['preparing'],
  preparing: ['ready'],
  ready: ['served'],
  served: []
}

const ITEM_ROLE_ALLOWED_TARGETS = {
  admin: ['preparing', 'ready', 'served'],
  manager: ['preparing', 'ready', 'served'],
  kitchen: ['preparing', 'ready']
}

async function transitionOrderItemStatus(orderId, itemId, nextStatus, options = {}) {
  const connection = options.connection || db
  const role = options.role || 'admin'
  const roleTargets = ITEM_ROLE_ALLOWED_TARGETS[role] || []

  if (!ITEM_ALLOWED_TRANSITIONS.hasOwnProperty(nextStatus)) {
    const error = new Error(`Invalid item status: ${nextStatus}`)
    error.statusCode = 400
    throw error
  }

  if (!roleTargets.includes(nextStatus)) {
    const error = new Error(`Role "${role}" cannot set item status to "${nextStatus}"`)
    error.statusCode = 403
    throw error
  }

  const [items] = await connection.query(
    'SELECT id, order_id, status FROM order_items WHERE id = ? AND order_id = ? LIMIT 1',
    [itemId, orderId]
  )

  if (!items.length) {
    const error = new Error('Order item not found')
    error.statusCode = 404
    throw error
  }

  const item = items[0]
  const allowedNext = ITEM_ALLOWED_TRANSITIONS[item.status] || []

  if (!allowedNext.includes(nextStatus)) {
    const error = new Error(
      `Cannot transition item from "${item.status}" to "${nextStatus}". Allowed: ${allowedNext.join(', ') || 'none'}`
    )
    error.statusCode = 400
    throw error
  }

  await connection.query('UPDATE order_items SET status = ? WHERE id = ?', [nextStatus, itemId])

  try {
    const { getIO } = require('../socket')
    const io = getIO()
    if (io) {
      await require('../socket').emitOrderEvent(orderId, 'order-item-status-changed', { order_id: Number(orderId), item_id: Number(itemId), status: nextStatus })
    }
  } catch { }
  const [orders] = await connection.query('SELECT status FROM orders WHERE id = ? LIMIT 1', [orderId])
  const orderStatus = orders[0] ? orders[0].status : null

  if (nextStatus === 'preparing' && orderStatus === 'confirmed') {
    await transitionOrderStatus(orderId, 'preparing', { ...options, connection })
  } else if (nextStatus === 'ready' && orderStatus === 'preparing') {
    const [[{ remaining }]] = await connection.query(
      `SELECT COUNT(*) as remaining FROM order_items WHERE order_id = ? AND status NOT IN ('ready', 'served')`,
      [orderId]
    )
    if (remaining === 0) {
      await transitionOrderStatus(orderId, 'ready', { ...options, connection })
    }
  }

  return { ...item, status: nextStatus }
}

module.exports = {
  ALLOWED_TRANSITIONS,
  ROLE_ALLOWED_TARGETS,
  ITEM_ALLOWED_TRANSITIONS,
  ITEM_ROLE_ALLOWED_TARGETS,
  emitOrderStatus,
  transitionOrderStatus,
  transitionOrderItemStatus
}
