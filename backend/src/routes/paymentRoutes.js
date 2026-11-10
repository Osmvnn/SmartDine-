const express = require('express')

const router = express.Router()

const paymentController = require('../controllers/paymentController')

const { auth, authorize } = require('../middleware/auth')

const { orderAccess, paymentAccess } = require('../middleware/resourceAccess')
const auditLog = require('../middleware/auditLogger')

router.get('/capabilities', paymentController.getCapabilities)

router.post('/', auth, orderAccess(req => req.body.order_id, ['admin', 'manager', 'cashier', 'waiter']), paymentController.processPayment)

router.post('/split', auth, orderAccess(req => req.body.order_id, ['admin', 'manager', 'cashier', 'waiter']), paymentController.splitPayment)

router.get('/order/:orderId', auth, orderAccess(req => req.params.orderId, ['admin', 'manager', 'cashier', 'waiter']), paymentController.getPaymentByOrder)

router.get('/pending', auth, authorize('cashier', 'admin', 'manager', 'waiter'), paymentController.getPendingPayments)

router.get('/recent', auth, authorize('cashier', 'admin', 'manager'), paymentController.getRecentPayments)

router.post('/confirm/:payment_id', auth, authorize('cashier', 'admin', 'waiter'), paymentAccess, paymentController.confirmCashPayment)

router.post('/refund/:payment_id', auth, authorize('cashier', 'admin', 'manager'), paymentAccess, auditLog('payment', { action: 'refund' }), paymentController.refundPayment)

router.post('/notify-cash', auth, orderAccess(req => req.body.order_id, ['admin', 'manager', 'cashier', 'waiter']), paymentController.notifyCashPayment)

module.exports = router