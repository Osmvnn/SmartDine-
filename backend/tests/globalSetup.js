const initTestDb = require('../database/init_test_db')

module.exports = async () => {
  await initTestDb()
}
