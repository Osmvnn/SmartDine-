const express = require('express')

const router = express.Router()

const sc = require('../controllers/shiftController')

const { auth, authorize } = require('../middleware/auth')

router.post('/clock-in', auth, authorize('admin', 'manager', 'waiter', 'kitchen', 'cashier'), sc.clockIn)

router.post('/clock-out', auth, authorize('admin', 'manager', 'waiter', 'kitchen', 'cashier'), sc.clockOut)

router.get('/my', auth, sc.getMyShifts)

router.get('/history', auth, authorize('admin', 'manager'), sc.getShiftsHistory)

router.get('/', auth, authorize('admin', 'manager'), sc.getAllShifts)

module.exports = router