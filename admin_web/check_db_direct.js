const pg = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    envVars[key] = value;
  }
});

async function main() {
  const connectionString = envVars['DATABASE_URL'];
  if (!connectionString) {
    console.error("DATABASE_URL not found in .env");
    return;
  }
  
  console.log("Connecting to database directly using DATABASE_URL...");
  const pool = new pg.Pool({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to DB.");
    const res = await client.query('SELECT id, name, public FROM storage.buckets');
    console.log('--- MODULES FROM DATABASE ---');
    console.log(JSON.stringify(res.rows, null, 2));
    client.release();
  } catch (err) {
    console.error("❌ Failed to query database:", err.message);
  } finally {
    await pool.end();
  }
}

main();
