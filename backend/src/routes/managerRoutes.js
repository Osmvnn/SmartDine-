const express = require('express')

const router = express.Router()

const managerController = require('../controllers/managerController')

const { auth, authorize } = require('../middleware/auth')

router.get('/dashboard', auth, authorize('manager', 'admin'), managerController.getDashboard)

router.get('/sales', auth, authorize('manager', 'admin'), managerController.getSales)

router.get('/tips', auth, authorize('manager', 'admin'), managerController.getTipReport)

router.get('/staff-performance', auth, authorize('manager', 'admin'), managerController.getStaffPerformance)

router.get('/tables', auth, authorize('manager', 'admin'), managerController.getTableStats)

router.get('/tables/history', auth, authorize('manager', 'admin'), managerController.getTableHistory)

router.get('/export/csv', auth, authorize('manager', 'admin'), managerController.exportSalesCSV)

router.get('/export/pdf', auth, authorize('manager', 'admin'), managerController.exportSalesPDF)

module.exports = router