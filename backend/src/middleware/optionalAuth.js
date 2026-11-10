const { auth } = require('./auth')
module.exports = (req, res, next) => req.header('Authorization') ? auth(req, res, next) : next()
