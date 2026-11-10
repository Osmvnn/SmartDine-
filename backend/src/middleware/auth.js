const { verifyIdentity, JWT_SECRET } = require('../services/identity')
const { logSecurityEvent } = require('../services/securityLog')
async function auth(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.header('Authorization') || '')
  if (!match) {
    logSecurityEvent('unauthorized', req, { details: { reason: 'missing_bearer_token' } })
    return res.status(401).json({ success: false, message: 'Sign in to continue' })
  }
  try { req.user = await verifyIdentity(match[1]) }
  catch {
    logSecurityEvent('invalid_token', req, { details: { reason: 'invalid_or_revoked' } })
    return res.status(401).json({ success: false, message: 'Invalid, expired, or revoked access' })
  }
  next()
}
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    logSecurityEvent('forbidden', req, { userId: req.user?.id, details: { requiredRoles: roles } })
    return res.status(403).json({ success: false, message: 'Access forbidden for your role' })
  }
  next()
}
module.exports = { auth, authorize, JWT_SECRET }
