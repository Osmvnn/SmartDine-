let io = null

function init(server) {

  const { Server } = require('socket.io')

  const allowedOrigins = process.env.ALLOWED_ORIGINS

    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())

    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']

  io = new Server(server, {

    cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }

  })

  io.on('connection', (socket) => {

    socket.on('join', (room) => {

      socket.join(room)

    })

    socket.on('leave', (room) => {

      socket.leave(room)

    })

  })

  return io

}

function getIO() {

  return io

}

module.exports = { init, getIO }