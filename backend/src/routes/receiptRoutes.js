const express = require('express')

const router = express.Router()

const rc = require('../controllers/receiptController')

router.get('/:id', rc.generateReceipt)

module.exports = router