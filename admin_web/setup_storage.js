const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  console.log('Checking/Creating "modules" bucket in Supabase Storage...');

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    return;
  }

  const bucketExists = buckets.find(b => b.name === 'modules');

  if (!bucketExists) {
    console.log('Bucket "modules" not found. Creating it now...');
    const { data, error: createError } = await supabase.storage.createBucket('modules', {
      public: false, // Keep it private for security
      allowedMimeTypes: ['application/pdf', 'video/mp4'],
      fileSizeLimit: 52428800 // 50MB
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError.message);
    } else {
      console.log('✅ Bucket "modules" created successfully!');
    }
  } else {
    console.log('✅ Bucket "modules" already exists. Good to go!');
  }
}

setupStorage();
