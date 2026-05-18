const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  const email = 'admin@bpr.com';
  const password = 'AdminPassword123!';
  
  console.log(`Creating admin user: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nip: '000000',
      full_name: 'Super Admin',
      division_id: 1,
      role: 'ADMIN'
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('Admin already exists.');
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.log('✅ Admin created successfully!');
  }
}

createAdmin();
