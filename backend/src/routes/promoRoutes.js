const express = require('express')

const router = express.Router()

const pc = require('../controllers/promoController')

const { auth, authorize } = require('../middleware/auth')

const auditLog = require('../middleware/auditLogger')

router.get('/', auth, authorize('admin', 'manager'), pc.getPromoCodes)

router.post('/', auth, authorize('admin', 'manager'), auditLog('promo'), pc.createPromoCode)

router.put('/:id', auth, authorize('admin', 'manager'), auditLog('promo'), pc.updatePromoCode)

router.delete('/:id', auth, authorize('admin', 'manager'), auditLog('promo'), pc.deletePromoCode)

router.post('/validate', pc.validatePromo)

module.exports = router