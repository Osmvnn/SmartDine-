// Pass the database URL directly to the CLI without shell interpolation or logging it.
// Usage: node backend/scripts/supabase-remote.js <path-to-supabase.exe> migration list
const path = require('node:path')
const { spawnSync } = require('node:child_process')
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true })
const [executable, ...args] = process.argv.slice(2)
if (!executable || !process.env.DATABASE_URL) throw new Error('CLI executable and DATABASE_URL are required')
const result = spawnSync(executable, [...args, `--remote=${process.env.DATABASE_URL}`], {
  cwd: path.join(__dirname, '../..'), encoding: 'utf8', windowsHide: true
})
const password = decodeURIComponent(new URL(process.env.DATABASE_URL).password)
const redact = text => {
  const output = String(text || '').replaceAll(process.env.DATABASE_URL, '[DATABASE_URL]')
  return password ? output.replaceAll(password, '[REDACTED]') : output
}
if (result.stdout) process.stdout.write(redact(result.stdout))
if (result.stderr) process.stderr.write(redact(result.stderr))
if (result.error) console.error(result.error.code || 'Unable to execute Supabase CLI')
process.exitCode = result.status ?? 1
