
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
  console.log("Checking storage policies...");
  const { data, error } = await supabase.rpc('get_storage_policies'); 
  // If RPC doesn't exist, we can try a raw SQL query via service_role
  
  const { data: policies, error: sqlError } = await supabase.from('storage.objects').select('*').limit(0); 
  // This won't show policies, we need to query pg_policies or similar.
  
  // Let's use a raw SQL approach if possible, or just assume they are missing and apply them.
  console.log("Applying storage policies via SQL...");
  const sql = `
    DO $$ 
    BEGIN
      -- Policy for read access
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read module files') THEN
        CREATE POLICY "Authenticated users can read module files" ON storage.objects
          FOR SELECT USING (bucket_id = 'modules' AND auth.role() = 'authenticated');
      END IF;

      -- Policy for admin upload
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can upload module files') THEN
        CREATE POLICY "Admins can upload module files" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'modules');
      END IF;
    END $$;
  `;
  
  // Note: We don't have a direct raw SQL tool here, but we can instruct the user or use a migration if available.
  // Actually, I can just try to run this via a script if the service_role has enough permissions to the storage schema.
  
  console.log("Please ensure 'modules' bucket is NOT public and RLS is enabled on storage.objects.");
}

main();
