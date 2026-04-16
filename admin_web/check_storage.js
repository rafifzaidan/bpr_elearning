const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.tqskhwdcofsxomtjpctw:Georgiza123.@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'storage' AND table_name = 'buckets'");
    console.log(res.rows.map(r => r.column_name).join(', '));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
