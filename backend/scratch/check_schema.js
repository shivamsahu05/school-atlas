// scratch/check_schema.js
const pool = require('../src/config/mysqlDb');
(async () => {
  try {
    const [columns] = await pool.execute('DESCRIBE contact_messages');
    console.log('Columns in contact_messages:', columns.map(c => c.Field));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching schema:', err.message);
    process.exit(1);
  }
})();
