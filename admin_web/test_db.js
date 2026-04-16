const pg = require('pg');

async function testConnection() {
  const passwords = ['Georgiza.', 'Georgiza123.'];
  const projectId = 'tqskhwdcofsxomtjpctw';
  const directHost = `db.${projectId}.supabase.co`;

  for (const pw of passwords) {
    console.log(`\n--- Testing password: [${pw}] on direct host ---`);
    const pool = new pg.Pool({
      connectionString: `postgresql://postgres.${projectId}:${pw}@${directHost}:5432/postgres`,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await pool.connect();
      console.log(`✅ SUCCESS with [${pw}] on DIRECT host`);
      const res = await client.query('SELECT current_user');
      console.log('Query result:', res.rows[0]);
      client.release();
      await pool.end();
      return pw;
    } catch (err) {
      console.error(`❌ FAILED with [${pw}] on DIRECT host: ${err.message}`);
      await pool.end();
    }
  }
  return null;
}

testConnection();
