// Point every test file's db pool at the dedicated test database before
// src/config/db.js (and its dotenv load) runs.
process.env.DB_NAME = process.env.TEST_DB_NAME || 'smart_restaurant_test'
