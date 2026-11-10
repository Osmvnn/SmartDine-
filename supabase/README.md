# Supabase database

The initial PostgreSQL schema is tracked in [the baseline migration](./migrations/20261110125704_baseline.sql). [schema.sql](./schema.sql) is a reference copy. The hosted database has 23 application tables and no migrated MySQL demo rows.

Database access remains server-side. The Vue app must call the Express API, and only the Express backend should receive a Supabase/PostgreSQL connection string. Do not add a service-role key or database password to frontend environment variables.

All application tables have row-level security enabled, with no browser policies. Explicit table and sequence grants to `anon`, `authenticated`, and `PUBLIC` were revoked. The security advisor may report `RLS Enabled No Policy`; this is intentional while the browser is not a database client. The backend connection must use a server credential with access to these tables.

## Backend setup and verification

Set `DB_PROVIDER=postgres`, `DATABASE_URL` to the Session pooler URI, and `DB_SSL=true` in `backend/.env`. The local backend is configured this way. The connection string stays on the Express server; the Vue app continues to use the API.

From `backend`, run `npm run db:check` to check the connection, table count, and TLS status. Run `npm run db:smoke` to test menu, registration, reports, reservations, order creation, cash settlement, and status transitions against Supabase. The smoke test creates temporary records and removes them after the run. Both commands passed against the connected project.

`npm run seed` creates an idempotent sample catalog. It has already created five tables, four categories, and eight menu items in the connected project. To create the first admin account, set `SEED_ADMIN_EMAIL` and a unique `SEED_ADMIN_PASSWORD` of at least 16 characters in `backend/.env`, then rerun `npm run seed`. The script will not overwrite an existing admin password or promote a customer account. The old MySQL seed remains available as `npm run seed:mysql` for legacy local setups only.

TLS is encrypted by default. To verify the server certificate as well, download the project CA certificate from Supabase Database Settings and set `DB_SSL_CA_FILE` to its local path. Without that certificate, the driver requires TLS but does not verify server identity, matching Supabase's `sslmode=require` guidance.

## Migration history and verification

The baseline was replayed in a rolled-back isolated schema and compared with the hosted database, including columns, constraints, indexes, RLS, grants, types, triggers, and functions. It was marked applied in migration history without recreating tables. The [one-active-session migration](./migrations/20261110125711_order_concurrency.sql) was then applied. Do not reapply the baseline to the existing database. New databases should apply both migrations in order. Supabase CLI 3.1.0 was used; v3 defaults to local, so target the intended remote explicitly.

Run `node backend/scripts/verify-migrations.js` for schema parity and `node backend/scripts/verify-postgres-workflows.js` for tagged API and concurrency fixtures against a development database. The latter covers staff writes, stock and session races, payment collection, receipt PDF, refund recording, customer departure, loyalty reward stock, and push subscription management. It does not test push delivery or browser notification permission.

## Remaining work

Complete an interactive browser pass across customer, waiter, cashier, and admin roles, including refresh and reconnect behavior. Implement persistent request idempotency and a real payment provider before accepting online payments.
