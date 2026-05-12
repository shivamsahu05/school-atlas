const pool = require('../src/config/mysqlDb');

async function debugAll() {
  try {
    console.log('--- STEP 2: VERIFY DB CONNECTION ---');
    const conn = await pool.getConnection();
    console.log('✅ DB CONNECTED SUCCESSFULLY');
    conn.release();

    console.log('\n--- STEP 3: CHECK WRONG DATABASE ---');
    const [db] = await pool.execute("SELECT DATABASE() as db");
    console.log("CURRENT DB:", db[0].db);

    console.log('\n--- STEP 4: CHECK TABLE NAME ---');
    const [tables] = await pool.execute("SHOW TABLES");
    console.log("TABLES IN DB:", tables.map(t => Object.values(t)[0]));
    
    const exists = tables.some(t => Object.values(t)[0] === 'syllabus_plan');
    console.log("syllabus_plan exists:", exists);

    console.log('\n--- STEP 1: HARD RESET TEST (SELECT *) ---');
    const [rows] = await pool.execute('SELECT * FROM syllabus_plan');
    console.log("ROWS LENGTH:", rows.length);
    if (rows.length > 0) {
      console.log("FIRST ROW PREVIEW:", rows[0]);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR DURING DEBUG >>>", err.message);
    console.error("STACK >>>", err.stack);
    process.exit(1);
  }
}

debugAll();
