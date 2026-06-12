const express = require('express')

const router = express.Router()

const adminController = require('../controllers/adminController')

const securityController = require('../controllers/securityController')

const { auth, authorize } = require('../middleware/auth')

const auditLog = require('../middleware/auditLogger')

router.get('/stats', auth, authorize('admin'), adminController.getStats)

router.get('/users', auth, authorize('admin'), adminController.getUsers)

router.post('/users', auth, authorize('admin'), auditLog('user'), adminController.createUser)

router.put('/users/:id', auth, authorize('admin'), auditLog('user'), adminController.updateUser)

router.delete('/users/:id', auth, authorize('admin'), auditLog('user'), adminController.deleteUser)

router.get('/categories', auth, authorize('admin'), adminController.getCategories)

router.post('/categories', auth, authorize('admin'), auditLog('category'), adminController.createCategory)

router.put('/categories/:id', auth, authorize('admin'), auditLog('category'), adminController.updateCategory)

router.delete('/categories/:id', auth, authorize('admin'), auditLog('category'), adminController.deleteCategory)

router.get('/items', auth, authorize('admin', 'manager'), adminController.getItems)

router.post('/items', auth, authorize('admin'), adminController.upload.single('image'), auditLog('menu_item'), adminController.createItem)

router.put('/items/:id', auth, authorize('admin', 'manager'), adminController.upload.single('image'), auditLog('menu_item'), adminController.updateItem)

router.delete('/items/:id', auth, authorize('admin'), auditLog('menu_item'), adminController.deleteItem)

router.get('/items/:id/modifiers', auth, authorize('admin', 'manager'), adminController.getModifiers)

router.post('/items/:id/modifiers', auth, authorize('admin'), auditLog('modifier'), adminController.createModifier)

router.put('/modifiers/:modifierId', auth, authorize('admin'), auditLog('modifier'), adminController.updateModifier)

router.delete('/modifiers/:modifierId', auth, authorize('admin'), auditLog('modifier'), adminController.deleteModifier)

router.get('/tables', auth, authorize('admin'), adminController.getTables)

router.post('/tables', auth, authorize('admin'), auditLog('table'), adminController.createTable)

router.put('/tables/:id', auth, authorize('admin'), auditLog('table'), adminController.updateTable)

router.delete('/tables/:id', auth, authorize('admin'), auditLog('table'), adminController.deleteTable)

router.get('/waiters', auth, authorize('admin'), adminController.getWaiters)

router.put('/tables/:id/assign', auth, authorize('admin'), auditLog('table'), adminController.assignWaiter)

router.get('/orders', auth, authorize('admin'), adminController.getAllOrders)

router.get('/orders/history', auth, authorize('admin'), adminController.getOrdersHistory)

router.get('/loyalty-rewards', auth, authorize('admin', 'manager'), adminController.getLoyaltyRewards)

router.post('/loyalty-rewards', auth, authorize('admin'), auditLog('loyalty_reward'), adminController.createLoyaltyReward)

router.put('/loyalty-rewards/:id', auth, authorize('admin'), auditLog('loyalty_reward'), adminController.updateLoyaltyReward)

router.delete('/loyalty-rewards/:id', auth, authorize('admin'), auditLog('loyalty_reward'), adminController.deleteLoyaltyReward)

router.get('/audit-log', auth, authorize('admin'), adminController.getAuditLog)

router.get('/security/summary', auth, authorize('admin'), securityController.getSecuritySummary)

router.get('/security/history', auth, authorize('admin'), securityController.getSecurityHistory)

router.get('/security/events', auth, authorize('admin'), securityController.getSecurityEvents)

router.get('/security/blocked-ips', auth, authorize('admin'), securityController.getBlockedIps)

router.post('/security/block-ip', auth, authorize('admin'), securityController.blockIp)

router.delete('/security/blocked-ips/:ip', auth, authorize('admin'), securityController.unblockIp)

module.exports = router