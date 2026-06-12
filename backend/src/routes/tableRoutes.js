const express = require('express')

const router = express.Router()

const tableController = require('../controllers/tableController')

const { auth, authorize } = require('../middleware/auth')

router.get('/', tableController.getTables)

router.get('/number/:tableNumber', tableController.getTableByNumber)

router.get('/qr/:qrToken', tableController.getTableByQR)

router.post('/qr/:qrToken/done', tableController.customerDone)

router.put('/:id/status', auth, authorize('admin', 'manager', 'waiter'), tableController.updateTableStatus)

router.post('/sessions/close', auth, authorize('admin', 'manager', 'waiter'), tableController.closeSession)

module.exports = router
