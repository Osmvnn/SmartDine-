const express = require('express')

const router = express.Router()

const rc = require('../controllers/reservationController')

const { auth, authorize } = require('../middleware/auth')

const auditLog = require('../middleware/auditLogger')

router.post('/', rc.createReservation)

router.get('/', rc.getReservations)

router.get('/available', rc.getAvailableTables)

router.put('/:id/status', auth, authorize('admin', 'manager'), auditLog('reservation'), rc.updateReservationStatus)

router.delete('/:id', auth, authorize('admin', 'manager'), auditLog('reservation'), rc.deleteReservation)

module.exports = router