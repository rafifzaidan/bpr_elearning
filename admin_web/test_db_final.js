const pg = require('pg');

async function testConnection() {
  const passwords = ['Georgiza123.', 'Georgiza.'];
  const projectId = 'tqskhwdcofsxomtjpctw';
  const host = 'aws-1-ap-southeast-1.pooler.supabase.com';

  for (const pw of passwords) {
    console.log(`\n--- Testing password: [${pw}] ---`);
    // Try both transaction (6543) and session (5432) ports on the pooler
    const ports = ['5432', '6543'];
    
    for (const port of ports) {
      const pool = new pg.Pool({
        connectionString: `postgresql://postgres.${projectId}:${pw}@${host}:${port}/postgres${port === '6543' ? '?pgbouncer=true' : ''}`,
        connectionTimeoutMillis: 5000,
      });

      try {
        const client = await pool.connect();
        console.log(`✅ SUCCESS with [${pw}] on port ${port}`);
        client.release();
        await pool.end();
        return { pw, port };
      } catch (err) {
        console.error(`❌ FAILED with [${pw}] on port ${port}: ${err.message}`);
        await pool.end();
      }
    }
  }
  return null;
}

testConnection();
