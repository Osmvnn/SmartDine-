const express = require('express')

const router = express.Router()

const tableController = require('../controllers/tableController')

const { auth, authorize } = require('../middleware/auth')

const { tableAccess } = require('../middleware/resourceAccess')
const { customerDoneAccess } = require('../middleware/customerAccess')
router.get('/', auth, authorize('admin', 'manager', 'waiter', 'cashier', 'kitchen'), tableController.getTables)

router.get('/number/:tableNumber', auth, authorize('admin', 'manager', 'waiter', 'cashier', 'kitchen'), tableController.getTableByNumber)

router.get('/qr/:qrToken', tableController.getTableByQR)

router.post('/qr/:qrToken/done', auth, customerDoneAccess, tableController.customerDone)

router.put('/:id/status', auth, authorize('admin', 'manager', 'waiter'), tableAccess(req => req.params.id), tableController.updateTableStatus)

router.post('/sessions/close', auth, authorize('admin', 'manager', 'waiter'), tableAccess(req => req.body.table_id), tableController.closeSession)

module.exports = router
