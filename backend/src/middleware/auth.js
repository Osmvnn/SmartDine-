const jwt = require('jsonwebtoken')

const { logSecurityEvent } = require('../services/securityLog')

if (!process.env.JWT_SECRET) {

  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.')

  process.exit(1)

}

const JWT_SECRET = process.env.JWT_SECRET

const auth = (req, res, next) => {

  const header = req.header('Authorization')

  if (!header) {

    logSecurityEvent('unauthorized', req, { details: { reason: 'no_token' } })

    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' })

  }

  const token = header.replace('Bearer ', '')

  try {

    const decoded = jwt.verify(token, JWT_SECRET)

    req.user = decoded

    next()

  } catch (err) {

    logSecurityEvent('invalid_token', req, { details: { reason: err.message } })

    res.status(401).json({ success: false, message: 'Invalid or expired token' })

  }

}

const authorize = (...roles) => {

  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {

      logSecurityEvent('forbidden', req, { userId: req.user.id, email: req.user.email, details: { role: req.user.role, requiredRoles: roles } })

      return res.status(403).json({ success: false, message: 'Access forbidden for your role' })

    }

    next()

  }

}

module.exports = { auth, authorize, JWT_SECRET }