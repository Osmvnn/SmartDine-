const express = require('express')

const router = express.Router()

const ic = require('../controllers/inventoryController')

const { auth, authorize } = require('../middleware/auth')

const auditLog = require('../middleware/auditLogger')

router.get('/categories', auth, authorize('admin', 'manager'), ic.getCategories)

router.get('/', auth, authorize('admin', 'manager'), ic.getItems)

router.get('/:id', auth, authorize('admin', 'manager'), ic.getItem)

router.post('/', auth, authorize('admin', 'manager'), auditLog('inventory_item'), ic.createItem)

router.put('/:id', auth, authorize('admin', 'manager'), auditLog('inventory_item'), ic.updateItem)

router.post('/:id/restock', auth, authorize('admin', 'manager'), auditLog('inventory_item'), ic.restockItem)

router.delete('/:id', auth, authorize('admin', 'manager'), auditLog('inventory_item'), ic.deleteItem)

module.exports = router