const pool = require('./config/db');

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT * FROM Users LIMIT 1');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit();
  }
}

testConnection();
