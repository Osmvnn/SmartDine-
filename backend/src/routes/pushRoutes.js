const express = require('express')

const router = express.Router()

const pushController = require('../controllers/pushController')

router.get('/vapid-public-key', pushController.getPublicKey)

router.post('/subscribe', pushController.subscribe)

router.post('/unsubscribe', pushController.unsubscribe)

module.exports = router
