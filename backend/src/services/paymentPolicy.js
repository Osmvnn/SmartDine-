function demoPaymentsEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.ALLOW_DEMO_PAYMENTS === 'true'
}

function paymentStatus(total, timing) {
  if (!Number.isFinite(Number(total)) || Number(total) < 0) throw Object.assign(new Error('Invalid order total'), { statusCode: 400 })
  if (!['pre', 'post'].includes(timing)) throw Object.assign(new Error('Invalid payment timing'), { statusCode: 400 })
  if (Number(total) === 0) return 'paid'
  if (timing === 'post') return 'pending'
  if (demoPaymentsEnabled()) return 'paid'
  throw Object.assign(new Error('Online payments are not configured. Choose pay later and settle with staff.'), { statusCode: 409 })
}

function validatePaymentInput(input) {
  if ('status' in input || 'transaction_id' in input || 'cashier_confirmed' in input) {
    throw Object.assign(new Error('Payment verification fields cannot be supplied by the client'), { statusCode: 400 })
  }
  if (input.method && !['card', 'cash', 'mobile'].includes(input.method)) throw Object.assign(new Error('Invalid payment method'), { statusCode: 400 })
  if (input.tip !== undefined && (typeof input.tip !== 'number' || !Number.isFinite(input.tip) || input.tip < 0)) throw Object.assign(new Error('Invalid tip'), { statusCode: 400 })
}
module.exports = { demoPaymentsEnabled, paymentStatus, validatePaymentInput }
