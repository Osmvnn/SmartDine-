const express = require('express')

const router = express.Router()

const rc = require('../controllers/reservationController')

const { auth, authorize } = require('../middleware/auth')

const optionalAuth = require('../middleware/optionalAuth')

const auditLog = require('../middleware/auditLogger')

router.post('/', optionalAuth, rc.createReservation)

router.get('/my', auth, rc.getMyReservations)

router.get('/', auth, authorize('admin', 'manager'), rc.getReservations)

router.get('/available', rc.getAvailableTables)

router.put('/:id/status', auth, authorize('admin', 'manager'), auditLog('reservation'), rc.updateReservationStatus)

router.delete('/:id', auth, authorize('admin', 'manager'), auditLog('reservation'), rc.deleteReservation)

module.exports = router
