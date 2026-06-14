# SmartDine - Restaurant Management System

A full-stack restaurant management and ordering platform: customers order from
their table via QR code, while staff (admin, manager, kitchen, waiter, cashier)
manage menus, orders, payments, reservations, and inventory in real time.

## Tech Stack

- **Backend**: Node.js, Express, MySQL (mysql2), Socket.io, JWT auth
- **Frontend**: Vue 3, Vite, Pinia, Vue Router, Bootstrap 5, Socket.io client

## Prerequisites

- Node.js v20 or higher
- MySQL 8.x (e.g. via XAMPP)
- npm (included with Node.js)

## Database Setup

1. Start MySQL.
2. Create a new database named `smart_restaurant` (the schema script does this
   for you if you run it directly with the MySQL CLI):
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```
   This creates all required tables.

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
```

Open `.env` and set:
- `DB_PASSWORD` - your MySQL root password (leave empty for XAMPP default)
- `JWT_SECRET` - any long random string (a default is pre-filled)

Seed the database with demo data:
```bash
npm run seed
```

Start the backend server:
```bash
npm start
```
The server runs on `http://localhost:5000`.

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
```
The default `.env` points to `http://localhost:5000/api`, which is correct for
local development.

Start the frontend dev server:
```bash
npm run dev
```
The application runs on `http://localhost:5173`.

## Accessing the System

**Staff Login** - `http://localhost:5173/login` (all accounts use password `SmartDine@2024`):

| Role    | Email              |
|---------|--------------------|
| Admin   | admin@smart.com    |
| Manager | manager@smart.com  |
| Kitchen | kitchen@smart.com  |
| Waiter  | waiter@smart.com   |
| Cashier | cashier@smart.com  |

**Customer Access** - scan a table's QR code, or navigate directly to
`http://localhost:5173/table/table_1`.

## Roles & Features

- **Admin** - full system control: users, tables, menu, orders, reservations, shifts
- **Manager** - sales reports, inventory management, promo codes, reservations
- **Kitchen** - view and update order status in real time, order history
- **Waiter** - manage assigned tables, handle waiter requests, clock in/out
- **Cashier** - confirm pending physical payments
- **Customer** - browse menu, place orders, pay, request waiter, make
  reservations, earn loyalty points

## Tests

```bash
cd backend
npm test
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deploying the backend (Railway) and
frontend (Vercel).
