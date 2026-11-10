const express = require('express')

const router = express.Router()

const pushController = require('../controllers/pushController')

router.get('/vapid-public-key', pushController.getPublicKey)

const { auth } = require('../middleware/auth')
router.post('/subscribe', auth, pushController.subscribe)

router.post('/unsubscribe', auth, pushController.unsubscribe)

module.exports = router
