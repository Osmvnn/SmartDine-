const express = require('express')

const router = express.Router()

const menuController = require('../controllers/menuController')

router.get('/categories', menuController.getCategories)

router.get('/items', menuController.getItems)

router.get('/grouped', menuController.getGroupedMenu)

const { auth } = require('../middleware/auth')
const { customerTableAccess } = require('../middleware/customerAccess')
const favoriteAccess = (req, res, next) => {
  req.body = { ...(req.body || {}), table_id: req.method === 'GET' ? req.query.session_id : req.body.session_id }
  return customerTableAccess(req, res, next)
}
router.get('/favorites', auth, favoriteAccess, menuController.getFavorites)

router.post('/favorites', auth, favoriteAccess, menuController.toggleFavorite)

module.exports = router
