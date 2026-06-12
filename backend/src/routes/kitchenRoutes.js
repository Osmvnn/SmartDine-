const express = require('express')

const router = express.Router()

const kitchenController = require('../controllers/kitchenController')

const { auth, authorize } = require('../middleware/auth')

router.get('/orders', auth, authorize('kitchen', 'admin'), kitchenController.getKitchenOrders)

router.put('/orders/:id/status', auth, authorize('kitchen', 'admin'), kitchenController.updateKitchenOrderStatus)

router.put('/orders/:id/items/:itemId/status', auth, authorize('kitchen', 'admin', 'manager'), kitchenController.updateOrderItemStatus)

module.exports = router