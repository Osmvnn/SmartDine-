const express = require('express')

const router = express.Router()

const waiterRequestController = require('../controllers/waiterRequestController')

const { auth, authorize } = require('../middleware/auth')

const { orderAccess, requestAccess } = require('../middleware/resourceAccess')
const { customerTableAccess } = require('../middleware/customerAccess')
router.get('/orders', auth, authorize('waiter', 'admin'), waiterRequestController.getWaiterOrders)

router.put('/orders/:id/status', auth, authorize('waiter', 'admin'), orderAccess(req => req.params.id), waiterRequestController.updateOrderStatus)

router.post('/', auth, customerTableAccess, waiterRequestController.createWaiterRequest)

router.get('/', auth, authorize('waiter', 'admin'), waiterRequestController.getWaiterRequests)

router.put('/:id/handled', auth, authorize('waiter', 'admin'), requestAccess, waiterRequestController.markHandled)

module.exports = router
