function toLocalDateStr(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayStr() {
  return toLocalDateStr(new Date())
}

export function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toLocalDateStr(d)
}
