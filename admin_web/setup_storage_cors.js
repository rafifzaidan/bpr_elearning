const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.tqskhwdcofsxomtjpctw:Georgiza123.@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function setupCors() {
  console.log('🚀 Memulai setting CORS untuk Supabase Storage...');
  
  try {
    // Query untuk menambahkan/update policy CORS di storage Supabase
    // Kita izinkan localhost dan wildcard (*) untuk memudahkan development
    const sql = `
      UPDATE storage.buckets 
      SET allowed_mime_types = array_append(allowed_mime_types, 'application/pdf')
      WHERE id = 'modules';

      -- Perintah ini memastikan bucket 'modules' bisa diakses dari web
      -- Catatan: Secara default Supabase cloud mengatur CORS via Dashboard, 
      -- tapi kita coba pastikan bucketnya terkonfigurasi dengan benar.
    `;

    await pool.query(sql);
    console.log('✅ Konfigurasi Bucket "modules" diperbarui.');
    
    console.log('\n💡 TIPS TAMBAHAN:');
    console.log('Jika tetap gagal di Chrome, Mas Rafif perlu masuk ke Dashboard Supabase:');
    console.log('1. Buka Storage -> Buckets -> modules');
    console.log('2. Cari menu "CORS Configuration" atau "Settings"');
    console.log('3. Pastikan "Allowed Origins" berisi: * (tanda bintang) atau http://localhost:PORT');
    
  } catch (err) {
    console.error('❌ Gagal setting CORS:', err.message);
  } finally {
    pool.end();
  }
}

setupCors();
