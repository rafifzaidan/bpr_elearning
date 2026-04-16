const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.tqskhwdcofsxomtjpctw:Georgiza123.@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    const res = await pool.query("UPDATE storage.buckets SET public = true WHERE id = 'modules'");
    console.log('Made bucket public. Rows affected:', res.rowCount);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
