const express = require('express')

const router = express.Router()

const rc = require('../controllers/receiptController')

const { auth } = require('../middleware/auth')
const { orderAccess } = require('../middleware/resourceAccess')
router.get('/:id', auth, orderAccess(req => req.params.id, ['admin', 'manager', 'cashier', 'waiter']), rc.generateReceipt)

module.exports = router
