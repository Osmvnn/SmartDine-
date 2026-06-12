import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    connected: false,
    notifications: [],
    currentRoom: null
  }),
  actions: {
    connect() {
      if (this.socket) return

      this.socket = io(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, ''),
        { transports: ['websocket', 'polling'] }
      )

      this.socket.on('connect', () => {
        this.connected = true
        if (this.currentRoom) {
          this.socket.emit('join', this.currentRoom)
        }
      })

      this.socket.on('disconnect', () => {
        this.connected = false
      })

      this.socket.on('new-order', (data) => {
        this.addNotification('New Order', `Order #${data.order_id} from Table ${data.table_number}`)
      })

      this.socket.on('order-status-changed', (data) => {
        this.addNotification('Order Update', `Order #${data.order_id} is now ${data.status}`)
      })

      this.socket.on('order-ready', (data) => {
        this.addNotification('Order Ready', `Order #${data.order_id} is ready for serving`)
      })

      this.socket.on('new-waiter-request', (data) => {
        this.addNotification('Waiter Request', `Table ${data.table_id}: ${data.type}`)
      })

      this.socket.on('order-paid', (data) => {
        this.addNotification('Payment', `Order #${data.order_id} has been paid`)
      })

      this.socket.on('cash-payment-pending', (data) => {
        this.addNotification('Cash Payment', `Table #${data.table_number}: Waiter coming with $${Number(data.total).toFixed(2)}`)
      })

      this.socket.on('pending-payment', (data) => {
        this.addNotification('Payment Pending', `Order #${data.order_id} awaiting payment`)
      })

      this.socket.on('payment-confirmed', (data) => {
        this.addNotification('Payment Confirmed', `Order #${data.order_id} payment confirmed`)
      })

      this.socket.on('low-stock-alert', (data) => {
        const title = data.level === 'out' ? 'Out of Stock' : 'Low Stock'
        this.addNotification(title, `${data.name} - ${data.stock_quantity} left`)
      })

      this.socket.on('payment-refunded', (data) => {
        this.addNotification('Payment Refunded', `Order #${data.order_id} payment was refunded`)
      })

      this.socket.on('table-available', (data) => {
        this.addNotification('Table Available', `Table ${data.table_number} is now available`)
      })
    },

    joinRoom(room) {
      this.currentRoom = room
      if (this.socket) {
        this.socket.emit('join', room)
      }
    },

    leaveRoom(room) {
      if (this.currentRoom === room) {
        this.currentRoom = null
      }
      if (this.socket) {
        this.socket.emit('leave', room)
      }
    },

    addNotification(title, message) {
      const notif = {
        id: Date.now(),
        title,
        message,
        time: new Date(),
        read: false
      }
      this.notifications.unshift(notif)
      if (this.notifications.length > 50) {
        this.notifications.pop()
      }
    },

    markRead(id) {
      const n = this.notifications.find(n => n.id === id)
      if (n) n.read = true
    },

    clearNotifications() {
      this.notifications = []
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.connected = false
      }
      this.currentRoom = null
    }
  }
})
