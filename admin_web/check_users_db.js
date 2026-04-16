const { Pool } = require('pg');

async function checkUser() {
  const connectionString = "postgresql://postgres.tqskhwdcofsxomtjpctw:Georgiza123.@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
  const pool = new Pool({ connectionString });
  
  try {
    const res = await pool.query(`
      SELECT id, nip, full_name, role 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);
    console.log('--- LATEST USERS ---');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkUser();
