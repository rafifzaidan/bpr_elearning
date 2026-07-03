const https = require('https');
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
  
  const projectId = 'tqskhwdcofsxomtjpctw';

  console.log("Fetching modules from database...");
  const pool = new pg.Pool({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000,
  });

  let modules = [];
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT id, title, file_url, file_type FROM "modules"');
    modules = res.rows;
    client.release();
  } catch (err) {
    console.error("❌ Failed to query database:", err.message);
    await pool.end();
    return;
  }

  console.log(`Checking ${modules.length} URLs...`);
  for (const m of modules) {
    if (!m.file_url) {
      console.log(`Module ID ${m.id} (${m.title}) has no file_url.`);
      continue;
    }
    
    // Construct public URL
    const encodedPath = encodeURIComponent(m.file_url);
    const url = `https://${projectId}.supabase.co/storage/v1/object/public/modules/${encodedPath}`;
    
    console.log(`Checking: ID=${m.id}, Title="${m.title}", URL="${url}"`);
    
    await new Promise((resolve) => {
      https.get(url, (res) => {
        console.log(`  -> Status code: ${res.statusCode}`);
        if (res.statusCode >= 300) {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log('  -> Error Body:', data);
            resolve();
          });
        } else {
          console.log(`  -> OK! Content-Length: ${res.headers['content-length']}`);
          resolve();
        }
      }).on('error', (e) => {
        console.error(`  -> Connection Error:`, e.message);
        resolve();
      });
    });
  }
  
  await pool.end();
}

main();
