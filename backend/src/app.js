const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const menuRoutes = require('./routes/menuRoutes')
const tableRoutes = require('./routes/tableRoutes')
const orderRoutes = require('./routes/orderRoutes')
const waiterRequestRoutes = require('./routes/waiterRequestRoutes')
const authRoutes = require('./routes/authRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const kitchenRoutes = require('./routes/kitchenRoutes')
const adminRoutes = require('./routes/adminRoutes')
const managerRoutes = require('./routes/managerRoutes')
const reservationRoutes = require('./routes/reservationRoutes')
const loyaltyRoutes = require('./routes/loyaltyRoutes')
const promoRoutes = require('./routes/promoRoutes')
const shiftRoutes = require('./routes/shiftRoutes')
const receiptRoutes = require('./routes/receiptRoutes')
const inventoryRoutes = require('./routes/inventoryRoutes')
const pushRoutes = require('./routes/pushRoutes')
const { logSecurityEvent } = require('./services/securityLog')
const { checkBlockedIp } = require('./middleware/blockCheck')

const app = express()

app.use(cors({
  origin: true,
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(checkBlockedIp)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logSecurityEvent('rate_limited', req, { details: { limiter: 'auth' } })
    res.status(options.statusCode).json(options.message)
  }
})

const promoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many promo validation requests.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logSecurityEvent('rate_limited', req, { details: { limiter: 'promo' } })
    res.status(options.statusCode).json(options.message)
  }
})

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/waiter-requests', waiterRequestRoutes)
app.use('/api/kitchen', kitchenRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/manager', managerRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/loyalty', loyaltyRoutes)
app.use('/api/promos', promoLimiter, promoRoutes)
app.use('/api/shifts', shiftRoutes)
app.use('/api/receipts', receiptRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/push', pushRoutes)

module.exports = app