const express = require('express')

const router = express.Router()

const waiterRequestController = require('../controllers/waiterRequestController')

const { auth, authorize } = require('../middleware/auth')

router.get('/orders', auth, authorize('waiter', 'admin'), waiterRequestController.getWaiterOrders)

router.put('/orders/:id/status', auth, authorize('waiter', 'admin'), waiterRequestController.updateOrderStatus)

router.post('/', waiterRequestController.createWaiterRequest)

router.get('/', auth, authorize('waiter', 'admin'), waiterRequestController.getWaiterRequests)

router.put('/:id/handled', auth, authorize('waiter', 'admin'), waiterRequestController.markHandled)

module.exports = router