const { Pool } = require('pg');

async function migrate() {
  const connectionString = "postgresql://postgres.tqskhwdcofsxomtjpctw:Georgiza123.@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
  const pool = new Pool({ connectionString });
  
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN email VARCHAR UNIQUE;`);
    console.log('Added email column');
  } catch(e) { console.log('email column exists or error:', e.message); }

  try {
    await pool.query(`ALTER TABLE users ADD COLUMN otp_code VARCHAR;`);
    console.log('Added otp_code column');
  } catch(e) { console.log('otp_code exists or error:', e.message); }

  try {
    await pool.query(`ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP WITH TIME ZONE;`);
    console.log('Added otp_expires_at column');
  } catch(e) { console.log('otp_expires_at exists or error:', e.message); }

  await pool.end();
}

migrate();
