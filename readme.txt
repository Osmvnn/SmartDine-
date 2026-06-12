================================================================================
  SmartDine - Restaurant Management System
  Graduation Project
================================================================================

PREREQUISITES
-------------
- Node.js v20 or higher (https://nodejs.org)
- MySQL 8.x via XAMPP (https://www.apachefriends.org)
- npm (included with Node.js)


DATABASE SETUP
--------------
1. Start XAMPP and ensure Apache and MySQL are running.
2. Open phpMyAdmin (http://localhost/phpmyadmin).
3. Create a new database named:  smart_restaurant
4. Select the database, click "Import", and import:
       backend/database/schema.sql
5. This creates all 17 required tables.


BACKEND SETUP
-------------
1. Navigate to the backend folder:
       cd backend

2. Install dependencies:
       npm install

3. Copy the environment template and configure it:
       copy .env.example .env
   Then open .env and set the values:
       - DB_PASSWORD  : your MySQL root password (leave empty if using XAMPP default)
       - JWT_SECRET   : any long random string (one is pre-filled, you may change it)

4. Seed the database with demo data:
       npm run seed

5. Start the backend server:
       npm start
   The server runs on:  http://localhost:5000


FRONTEND SETUP
--------------
1. Open a new terminal and navigate to the frontend folder:
       cd frontend

2. Install dependencies:
       npm install

3. Copy the environment template:
       copy .env.example .env
   The default value points to http://localhost:5000/api and is correct for local use.

4. Start the frontend development server:
       npm run dev
   The application runs on:  http://localhost:5173


ACCESSING THE SYSTEM
--------------------
Staff Login:
    URL:       http://localhost:5173/login
    Accounts   (all use password: SmartDine@2024)
      Admin    : admin@smart.com
      Manager  : manager@smart.com
      Kitchen  : kitchen@smart.com
      Waiter   : waiter@smart.com
      Cashier  : cashier@smart.com

Customer Access:
    Scan the QR code on a table, or navigate directly to:
      http://localhost:5173/table/table_1


ROLES & FEATURES
----------------
  Admin      : Full system control — users, tables, menu, orders, reservations, shifts
  Manager    : Sales reports, inventory management, promo codes, reservations
  Kitchen    : View and update order status in real time
  Waiter     : Manage assigned tables, handle waiter requests, clock in/out
  Cashier    : Confirm pending physical payments
  Customer   : Browse menu, place orders, pay, request waiter, earn loyalty points


TECHNOLOGY STACK
----------------
  Backend  : Node.js, Express, MySQL, Socket.io, JWT
  Frontend : Vue 3, Vite, Pinia, Vue Router, Bootstrap 5, Socket.io client


================================================================================
