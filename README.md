# SmartDine - Restaurant Management System

SmartDine is a Vue and Express application for table QR ordering, staff operations, payments, reservations, and inventory.

## Requirements

- Node.js 20 or newer, npm, and a Supabase PostgreSQL database
- Vue 3, Vite, Pinia, Bootstrap, and Socket.IO on the frontend
- Express, JWT, Socket.IO, and PostgreSQL (`pg`) on the backend

The Vue app calls Express. Keep the database connection string and JWT secret in `backend/.env`, never in frontend variables. MySQL files remain for legacy local setups; the active database and seed command use PostgreSQL.

## Database and backend

The hosted database already has the schema in the [baseline migration](supabase/migrations/20261110125704_baseline.sql). Apply migrations in timestamp order on a new database. On an existing database, compare it with the baseline before marking that migration applied; do not reapply the baseline over populated tables. See [Supabase setup](supabase/README.md).

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set `DB_PROVIDER=postgres`, `DATABASE_URL` to the Supabase session pooler URI, `DB_SSL=true`, `JWT_SECRET` to a long random value, `ALLOWED_ORIGINS` to the frontend origin, and `PORT=5000`. Set `DB_SSL_CA_FILE` to verify the server certificate when the project CA is available. Then run:

```powershell
npm run db:check
npm run seed
npm start
```

The seed creates a sample catalog. To create the first admin, set both `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (at least 16 characters) before seeding. It does not reset an existing admin password. There are no universal default staff passwords.

## Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Use `VITE_API_URL=http://localhost:5000/api` in `frontend/.env`, then visit http://localhost:5173. Staff sign in at `/login`; customers scan a table QR code and sign in before ordering.

## Verification

From the repository root:

```powershell
npm test --prefix backend
npm run build --prefix frontend
npm run db:check --prefix backend
node backend/scripts/verify-migrations.js
node backend/scripts/verify-postgres-workflows.js
```

The last two commands contact the configured PostgreSQL database. Migration verification rolls back its isolated schema. Workflow verification creates tagged test records and removes them; run it against a development database. `npm run db:smoke --prefix backend` provides a broader API smoke check.

Online payments need a real provider. See [security and payment notes](docs/SECURITY_CHANGES.md) and the [development roadmap](DEVELOPMENT_ROADMAP.md).
