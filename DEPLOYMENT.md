# Deploying SmartDine (free tier)

This project has two parts that deploy separately:

- **Backend** (`backend/`) – Express API + Socket.io + MySQL
- **Frontend** (`frontend/`) – Vue 3 / Vite static site

Recommended free-tier combo: **Railway** for the backend + MySQL database, **Vercel** for the frontend.
(Render's free tier does not include a free MySQL database, so Railway is simpler for this stack.)

## 0. Push the code to GitHub

1. Create a new empty repository on github.com (no README/license, just empty).
2. Locally:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo>.git
   git branch -M main
   git push -u origin main
   ```

## 1. Backend + Database on Railway

1. Go to railway.app, sign in with GitHub, click **New Project → Deploy from GitHub repo** and pick this repo.
2. Railway will detect multiple folders — set the service's **Root Directory** to `backend`.
3. Set the **Start Command** to `node src/server.js` (or leave default, since `package.json` has `start`).
4. Add a **MySQL** database to the project: **New → Database → MySQL**. Railway gives you connection details (host, port, user, password, database name) as variables like `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.
5. In the backend service's **Variables** tab, add:
   ```
   PORT=5000
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   DB_SSL=false
   JWT_SECRET=<generate a long random string>
   ALLOWED_ORIGINS=https://<your-frontend-domain>.vercel.app
   VAPID_PUBLIC_KEY=<from backend/.env>
   VAPID_PRIVATE_KEY=<from backend/.env>
   VAPID_SUBJECT=mailto:you@example.com
   ```
   (Railway lets you reference another service's variables with `${{ServiceName.VAR}}`.)
6. Deploy. Once live, note the public URL Railway gives the backend service (Settings → Networking → Generate Domain), e.g. `https://smartdine-backend.up.railway.app`.

### Initialize the database schema

After the MySQL service is up, run the schema + migrations against it once. Easiest way: temporarily set your local `backend/.env` `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`/`DB_SSL` to the Railway MySQL connection values (found in the MySQL service's **Connect** tab — use the public/proxy host+port), then from `backend/` run:

```bash
mysql -h <host> -P <port> -u <user> -p<password> <database> < database/schema.sql
node database/migrate_v2.js
node database/migrate_v3.js
node database/migrate_v4.js
node database/migrate_v5.js
node database/seed.js
```

Then restore your local `.env` back to your local DB settings.

## 2. Frontend on Vercel

1. Go to vercel.com, sign in with GitHub, **New Project**, pick this repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**. Build command `npm run build`, output directory `dist` (Vercel usually detects this automatically).
4. Add an environment variable:
   ```
   VITE_API_URL=https://<your-backend-domain>.up.railway.app/api
   ```
5. Deploy. Vercel gives you a URL like `https://smartdine.vercel.app`.
6. Go back to the Railway backend service and update `ALLOWED_ORIGINS` to this exact Vercel URL (comma-separate multiple origins if needed), then redeploy the backend.

## 3. Notes / limitations on free tiers

- **File uploads** (`backend/uploads/`, menu item images): Railway's filesystem is ephemeral on redeploy, so uploaded images can be lost when the service restarts/redeploys. Fine for a demo; for persistence you'd later move to an object storage service (e.g. Cloudinary, S3) — not required to get the app online.
- **Cold starts**: free services may sleep after inactivity and take a few seconds to wake on the first request.
- **CORS**: the backend's `ALLOWED_ORIGINS` env var controls which frontend origins can use Socket.io and the API; make sure it matches your deployed frontend URL exactly (including `https://`, no trailing slash).
- **Secrets**: never commit `backend/.env` or `frontend/.env` — they're already in `.gitignore`. Set all secrets via the hosting platform's dashboard.
