
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const key = envVars['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from('modules').select('*').ilike('title', '%geo%');
  if (error) console.error("DB Error:", error);
  else console.log("Module 'geo' metadata:", JSON.stringify(data, null, 2));

  if (data && data.length > 0) {
    const fileUrl = data[0].file_url;
    console.log("Checking storage for path:", fileUrl);
    
    // Check with and without 'modules/' prefix
    const path1 = fileUrl;
    const path2 = fileUrl.startsWith('modules/') ? fileUrl.replace('modules/', '') : `modules/${fileUrl}`;
    
    const res1 = await supabase.storage.from('modules').createSignedUrl(path1, 60);
    const res2 = await supabase.storage.from('modules').createSignedUrl(path2, 60);
    
    console.log(`Original Path Result: ${res1.error ? res1.error.message : 'OK: ' + res1.data.signedUrl}`);
    console.log(`Alternative Path Result: ${res2.error ? res2.error.message : 'OK: ' + res2.data.signedUrl}`);
  }
}

main();
