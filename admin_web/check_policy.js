const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query("SELECT * FROM pg_policies WHERE tablename = 'modules'").then(res => {
  console.log(res.rows);
  pool.end();
});
