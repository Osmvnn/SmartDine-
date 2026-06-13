const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('./auth')

module.exports = (req, res, next) => {
  const header = req.header('Authorization')

  if (header) {
    try {
      req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET)
    } catch { }
  }

  next()
}
