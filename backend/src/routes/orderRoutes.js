const express = require('express')
const rateLimit = require('express-rate-limit')

const router = express.Router()

const orderController = require('../controllers/orderController')

const { auth, authorize } = require('../middleware/auth')

const { logSecurityEvent } = require('../services/securityLog')

const createOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many orders placed. Please wait a few minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logSecurityEvent('rate_limited', req, { details: { limiter: 'create_order' } })
    res.status(options.statusCode).json(options.message)
  }
})

const optionalAuth = (req, res, next) => {

  const header = req.header('Authorization')

  if (!header) return next()

  const token = header.replace('Bearer ', '')

  try {

    const jwt = require('jsonwebtoken')

    const { JWT_SECRET } = require('../middleware/auth')

    req.user = jwt.verify(token, JWT_SECRET)

  } catch { }

  next()

}

router.post('/', createOrderLimiter, optionalAuth, orderController.createOrder)

router.get('/my', auth, orderController.getMyOrders)

router.get('/session/:session_id', orderController.getOrdersBySession)

router.get('/table/:table_id', orderController.getOrdersByTable)

router.get('/:id', orderController.getOrderById)

router.put('/:id/status', auth, authorize('admin', 'manager', 'kitchen', 'waiter'), orderController.updateOrderStatus)

router.put('/:id/cancel', orderController.cancelOrder)

router.post('/:id/rate', orderController.rateOrder)

router.get('/:id/rating', orderController.getOrderRating)

module.exports = router
