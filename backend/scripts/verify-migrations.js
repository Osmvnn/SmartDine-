// Replay in a unique schema inside a rolled-back transaction; no restaurant data changes.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true })
const { Pool } = require('pg')
const { connectionOptions } = require('../src/config/postgresDb')
const migrationDir = path.join(__dirname, '../../supabase/migrations')

async function snapshot(client, schema) {
  const { rows } = await client.query(`
    SELECT 'column' AS kind, c.relname || '.' || a.attname AS name,
      jsonb_build_object('type', pg_catalog.format_type(a.atttypid,a.atttypmod), 'notnull', a.attnotnull,
        'default', pg_catalog.pg_get_expr(d.adbin,d.adrelid), 'identity', a.attidentity) AS definition
    FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
    WHERE n.nspname=$1 AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped
    UNION ALL SELECT 'constraint', c.conname, to_jsonb(pg_catalog.pg_get_constraintdef(c.oid))
      FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON n.oid=c.connamespace WHERE n.nspname=$1
    UNION ALL SELECT 'index', indexname, to_jsonb(indexdef) FROM pg_catalog.pg_indexes WHERE schemaname=$1
    UNION ALL SELECT 'table', c.relname, jsonb_build_object('rls',c.relrowsecurity,'acl',c.relacl::text)
      FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relkind='r'
    UNION ALL SELECT 'enum', t.typname, jsonb_agg(e.enumlabel ORDER BY e.enumsortorder)
      FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace
      JOIN pg_catalog.pg_enum e ON e.enumtypid=t.oid WHERE n.nspname=$1 GROUP BY t.typname
    UNION ALL SELECT 'trigger', t.tgname, to_jsonb(pg_catalog.pg_get_triggerdef(t.oid))
      FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND NOT t.tgisinternal
    UNION ALL SELECT 'function', p.proname, to_jsonb(pg_catalog.pg_get_functiondef(p.oid))
      FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=$1
    UNION ALL SELECT 'function_acl', p.proname, to_jsonb(p.proacl::text)
      FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=$1
    UNION ALL SELECT 'sequence_acl', c.relname, to_jsonb(c.relacl::text)
      FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relkind='S'
    UNION ALL SELECT 'default_acl', a.defaclobjtype::text, to_jsonb(a.defaclacl::text)
      FROM pg_catalog.pg_default_acl a JOIN pg_catalog.pg_namespace n ON n.oid=a.defaclnamespace
      WHERE n.nspname=$1 AND a.defaclrole=(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=current_user)
    ORDER BY kind,name`, [schema])
  return JSON.parse(JSON.stringify(rows).replaceAll(schema + '.', 'SCHEMA.'))
}

async function main() {
  const pool = new Pool(connectionOptions())
  const client = await pool.connect()
  const schema = 'verify_' + crypto.randomBytes(8).toString('hex')
  try {
    await client.query('BEGIN')
    await client.query("SET LOCAL search_path = ''")
    await client.query(`CREATE SCHEMA ${schema}`)
    const files = fs.readdirSync(migrationDir).filter(x => x.endsWith('.sql')).sort()
    assert(files.length > 0, 'No migrations found')
    const baselineOnly = process.argv.includes('--baseline-only')
    for (const file of baselineOnly ? files.slice(0, 1) : files) {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8')
        .replaceAll('public.', schema + '.').replaceAll('schema public', 'schema ' + schema)
      await client.query(sql)
      console.log('Replayed ' + file)
    }
    assert.deepEqual(await snapshot(client, schema), await snapshot(client, 'public'), 'Migration schema differs from live public schema')
    console.log('PASS schema parity: columns, constraints, indexes, RLS/ACLs, enums, triggers, functions')
  } finally {
    await client.query('ROLLBACK')
    client.release()
    await pool.end()
    console.log('Rolled back isolated verification schema')
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
