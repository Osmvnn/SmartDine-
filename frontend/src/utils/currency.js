const RATES = {
  USD: 1,
  TRY: 32
}

const LABELS = {
  USD: 'USD',
  TRY: 'TRY'
}

export function getCurrency() {
  return localStorage.getItem('currency') || 'USD'
}

export function setCurrency(currency) {
  const next = RATES[currency] ? currency : 'USD'
  localStorage.setItem('currency', next)
  window.dispatchEvent(new CustomEvent('currency-changed', { detail: next }))
}

export function formatMoney(amount, currency = getCurrency()) {
  const code = RATES[currency] ? currency : 'USD'
  const value = Number(amount || 0) * RATES[code]
  return `${value.toFixed(2)} ${LABELS[code]}`
}

export function getRate(currency = getCurrency()) {
  return RATES[currency] ? RATES[currency] : RATES.USD
}
