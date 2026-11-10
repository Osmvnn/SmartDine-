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

const { orderAccess, tableAccess, sessionAccess } = require('../middleware/resourceAccess')
const { createOrderAccess } = require('../middleware/customerAccess')

router.post('/', createOrderLimiter, auth, createOrderAccess, orderController.createOrder)

router.get('/my', auth, orderController.getMyOrders)

router.get('/session/:session_id', auth, sessionAccess, orderController.getOrdersBySession)

router.get('/table/:table_id', auth, tableAccess(req => req.params.table_id), orderController.getOrdersByTable)

router.get('/:id', auth, orderAccess(req => req.params.id), orderController.getOrderById)

router.put('/:id/status', auth, authorize('admin', 'manager', 'kitchen', 'waiter'), orderAccess(req => req.params.id), orderController.updateOrderStatus)

router.put('/:id/cancel', auth, orderAccess(req => req.params.id, ['admin', 'manager', 'waiter']), orderController.cancelOrder)

router.post('/:id/rate', auth, authorize('customer'), orderAccess(req => req.params.id, []), orderController.rateOrder)

router.get('/:id/rating', auth, orderAccess(req => req.params.id), orderController.getOrderRating)

module.exports = router
