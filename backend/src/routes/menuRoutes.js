const express = require('express')

const router = express.Router()

const menuController = require('../controllers/menuController')

router.get('/categories', menuController.getCategories)

router.get('/items', menuController.getItems)

router.get('/grouped', menuController.getGroupedMenu)

router.get('/favorites', menuController.getFavorites)

router.post('/favorites', menuController.toggleFavorite)

module.exports = router