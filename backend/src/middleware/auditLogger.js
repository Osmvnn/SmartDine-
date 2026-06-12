const db = require('../config/db')

const ACTION_BY_METHOD = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete'
}

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return null
  const clone = {}
  for (const [key, value] of Object.entries(body)) {
    if (/password|token/i.test(key)) continue
    if (typeof value === 'string' && value.length > 200) {
      clone[key] = value.slice(0, 200) + '...'
    } else {
      clone[key] = value
    }
  }
  return JSON.stringify(clone)
}
function auditLog(entityType, options = {}) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res)
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success !== false && req.user) {
        const action = options.action || ACTION_BY_METHOD[req.method] || req.method.toLowerCase()
        const entityId = req.params.modifierId || req.params.payment_id || req.params.id ||
          (body?.data?.id != null ? body.data.id : null)
        const details = sanitizeBody(req.body)
        db.query(
          'INSERT INTO audit_log (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
          [req.user.id, req.user.name, action, entityType, entityId, details]
        ).catch(err => console.error('Audit log error:', err.message))
      }
      return originalJson(body)
    }
    next()
  }
}

module.exports = auditLog
