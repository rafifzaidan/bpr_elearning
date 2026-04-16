
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load from .env
const envPath = path.resolve(process.cwd(), '.env');
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

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const key = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!url || !key) {
  console.error("Missing URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log("Listing all objects in 'modules' bucket...");
  const { data, error } = await supabase.storage.from("modules").list('', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'desc' },
  });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Found", data.length, "objects:");
    data.forEach(obj => {
      console.log(`- ${obj.name} (ID: ${obj.id})`);
    });
  }
}

main();
