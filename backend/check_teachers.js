const pool = require('./src/config/mysqlDb');
async function check() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM teachers");
    console.log(JSON.stringify(cols, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
