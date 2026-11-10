const postgres = process.env.DB_PROVIDER === 'postgres'

const dateText = (column) => postgres
  ? `TO_CHAR(${column}, 'YYYY-MM-DD')`
  : `DATE_FORMAT(${column}, '%Y-%m-%d')`

const daysBeforeToday = postgres
  ? "CURRENT_DATE - (? * INTERVAL '1 day')"
  : 'DATE_SUB(CURDATE(), INTERVAL ? DAY)'

const sevenDaysBeforeToday = postgres
  ? "CURRENT_DATE - INTERVAL '7 days'"
  : 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)'

const sevenDaysBeforeNow = postgres
  ? "NOW() - INTERVAL '7 days'"
  : 'DATE_SUB(NOW(), INTERVAL 7 DAY)'

const hourOf = (column) => postgres ? `EXTRACT(HOUR FROM ${column})::int` : `HOUR(${column})`
const dayOfWeek = (column) => postgres ? `(EXTRACT(DOW FROM ${column})::int + 1)` : `DAYOFWEEK(${column})`
const textValue = (column) => postgres ? `${column}::text` : column
const elapsedMinutes = (start, end) => postgres
  ? `EXTRACT(EPOCH FROM (${end} - ${start})) / 60`
  : `TIMESTAMPDIFF(MINUTE, ${start}, ${end})`
const timeDifferenceMinutes = (column) => postgres
  ? `ABS(EXTRACT(EPOCH FROM (${column} - CAST(? AS time))) / 60)`
  : `ABS(TIMESTAMPDIFF(MINUTE, ${column}, ?))`

module.exports = { dateText, daysBeforeToday, sevenDaysBeforeToday, sevenDaysBeforeNow, hourOf, dayOfWeek, textValue, elapsedMinutes, timeDifferenceMinutes }
