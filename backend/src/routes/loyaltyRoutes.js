const express = require('express')

const router = express.Router()

const lc = require('../controllers/loyaltyController')

router.get('/balance', lc.getBalance)

router.get('/rewards', lc.getRewards)

router.post('/redeem', lc.redeemPoints)

module.exports = router