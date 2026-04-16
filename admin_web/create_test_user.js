const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const nip = '2024999';
  const fullName = 'Karyawan Test Live';
  const password = 'Password123!';
  const divisionId = 1; // TI / IT
  const email = `${nip}@bpr-jatim.internal`;

  console.log(`Creating user: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nip,
      full_name: fullName,
      division_id: divisionId,
      role: 'EMPLOYEE'
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('User already exists. You can proceed to test login.');
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.log('✅ User created successfully!');
    console.log('NIP:', nip);
    console.log('Password:', password);
  }
}

createTestUser();
