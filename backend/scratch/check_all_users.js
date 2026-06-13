require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const [users] = await pool.query("SELECT id, name, email, role FROM users");
    console.log("ALL USERS:");
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
