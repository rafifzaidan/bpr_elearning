const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const res = await pool.query(`SELECT prosrc FROM pg_proc WHERE proname = 'calculate_is_passed'`);
  console.log(res.rows[0].prosrc);
  pool.end();
}
check();
