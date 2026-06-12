const express = require('express')

const router = express.Router()

const paymentController = require('../controllers/paymentController')

const { auth, authorize } = require('../middleware/auth')

const auditLog = require('../middleware/auditLogger')

router.post('/', paymentController.processPayment)

router.post('/split', paymentController.splitPayment)

router.get('/order/:orderId', paymentController.getPaymentByOrder)

router.get('/pending', auth, authorize('cashier', 'admin', 'manager', 'waiter'), paymentController.getPendingPayments)

router.get('/recent', auth, authorize('cashier', 'admin', 'manager'), paymentController.getRecentPayments)

router.post('/confirm/:payment_id', auth, authorize('cashier', 'admin', 'waiter'), paymentController.confirmCashPayment)

router.post('/refund/:payment_id', auth, authorize('cashier', 'admin', 'manager'), auditLog('payment', { action: 'refund' }), paymentController.refundPayment)

router.post('/notify-cash', paymentController.notifyCashPayment)

module.exports = router