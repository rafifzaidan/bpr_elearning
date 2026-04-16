const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserTable() {
  const nip = '2024999';
  console.log(`Checking if NIP ${nip} exists in public.users table...`);

  const { data, error } = await supabase
    .from('users')
    .select('*, divisions(name)')
    .eq('nip', nip)
    .single();

  if (error) {
    console.error('❌ Error: User not found in public.users table yet.');
    console.log('This means the SQL trigger might not have fired or needs to be re-run in Supabase SQL Editor.');
  } else {
    console.log('✅ User found in profile table!');
    console.log('Nama:', data.full_name);
    console.log('Divisi:', data.divisions.name);
  }
}

checkUserTable();
