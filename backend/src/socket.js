const { verifyIdentity } = require('./services/identity')
const db = require('./config/db')
let io = null
const staffRoles = ['admin', 'manager', 'kitchen', 'cashier', 'waiter']
function allowedRooms(user) {
  return [`user-${user.id}`, ...(staffRoles.includes(user.role) ? [user.role] : [])]
}
function init(server) {
  const { Server } = require('socket.io')
  const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(',').map(s => s.trim())
  io = new Server(server, { cors: { origin: origins, methods: ['GET', 'POST'] } })
  io.use(async (socket, next) => {
    try {
      socket.data.user = await verifyIdentity(socket.handshake.auth?.token)
      next()
    } catch { next(new Error('Authentication required')) }
  })
  io.on('connection', socket => {
    const user = socket.data.user
    allowedRooms(user).forEach(room => socket.join(room))
    const revalidate = async () => {
      try { await verifyIdentity(socket.handshake.auth?.token); return true }
      catch { socket.disconnect(true); return false }
    }
    const timer = setInterval(revalidate, 15000)
    timer.unref()
    const expiry = setTimeout(() => socket.disconnect(true), Math.min(2147483647, Math.max(1, user.exp * 1000 - Date.now())))
    expiry.unref()
    socket.on('disconnect', () => { clearInterval(timer); clearTimeout(expiry) })
    socket.on('join', async (room, ack) => {
      if (!await revalidate()) return
      const permitted = typeof room === 'string' && allowedRooms(user).includes(room)
      if (permitted) await socket.join(room)
      if (typeof ack === 'function') ack({ success: permitted })
    })
    socket.on('leave', room => {
      if (typeof room === 'string' && allowedRooms(user).includes(room)) socket.leave(room)
    })
  })
  return io
}
async function emitOrderEvent(orderId, event, payload) {
  if (!io) return
  const [[order]] = await db.query('SELECT o.customer_id, t.waiter_id FROM orders o JOIN restaurant_tables t ON t.id = o.table_id WHERE o.id = ?', [orderId])
  if (!order) return
  const rooms = ['admin', 'manager', 'kitchen', 'cashier']
  if (order.customer_id) rooms.push(`user-${order.customer_id}`)
  if (order.waiter_id) rooms.push(`user-${order.waiter_id}`)
  io.to(rooms).emit(event, payload)
}
function getIO() { return io }
module.exports = { init, getIO, allowedRooms, emitOrderEvent }
