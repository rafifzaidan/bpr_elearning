const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const pg = require('pg');

// 1. Read .env file manually to get credentials
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error("File .env tidak ditemukan di folder admin_web!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
});

const databaseUrl = env['DATABASE_URL'];
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env!");
  process.exit(1);
}

console.log("Menghubungkan ke Supabase url:", supabaseUrl);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function registerAdmins() {
  const admins = [
    { email: 'admin@bpr.com', password: 'AdminPassword123!', full_name: 'Super Admin', nip: '9999999999' },
    { email: 'rafifsd25@gmail.com', password: 'AdminPassword123!', full_name: 'M. Rafif Zaidan Nuhaa', nip: '5323600013' }
  ];

  let pgPool = null;
  if (databaseUrl) {
    console.log("Menyiapkan koneksi database langsung (pg)...");
    pgPool = new pg.Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
    });
  }

  try {
    for (const admin of admins) {
      console.log(`\n-----------------------------------------`);
      console.log(`Memproses admin: ${admin.email}...`);
      
      let userId = null;

      // 1. Coba daftarkan di Supabase Auth jika belum terdaftar
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          nip: admin.nip,
          full_name: admin.full_name,
          division_id: 2, // Teknologi Informasi
          role: 'ADMIN',
          mfa_enabled: true
        }
      });

      if (authError) {
        const errMsg = authError.message.toLowerCase();
        if (errMsg.includes("already") || errMsg.includes("exists")) {
          console.log(`User ${admin.email} sudah terdaftar di Supabase Auth. Mengambil UID...`);
          // Dapatkan detail user dari auth list untuk mengambil UID-nya
          const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          if (listError) {
            console.error("Gagal mendapatkan list user:", listError.message);
            continue;
          }
          const existingUser = users.find(u => u.email === admin.email);
          if (existingUser) {
            userId = existingUser.id;
          } else {
            console.error(`Gagal menemukan UID untuk ${admin.email}`);
            continue;
          }
        } else {
          console.error(`Gagal mendaftarkan di Auth:`, authError.message);
          continue;
        }
      } else {
        userId = authUser.user.id;
        console.log(`Sukses mendaftarkan Auth dengan UID: ${userId}`);
      }

      // 2. Hubungkan ke database online lewat pg untuk update role ke ADMIN
      if (userId && pgPool) {
        try {
          console.log(`Melakukan sinkronisasi ke tabel database online...`);
          const pgClient = await pgPool.connect();
          
          // Cari ID divisi 'Teknologi Informasi' di database online
          const divRes = await pgClient.query("SELECT id FROM divisions WHERE name = 'Teknologi Informasi' LIMIT 1");
          let divisionId = 2; // Default fallback
          if (divRes.rows.length > 0) {
            divisionId = divRes.rows[0].id;
            console.log(`Menemukan divisi 'Teknologi Informasi' dengan ID: ${divisionId}`);
          } else {
            const insertDiv = await pgClient.query("INSERT INTO divisions (name) VALUES ('Teknologi Informasi') RETURNING id");
            divisionId = insertDiv.rows[0].id;
            console.log(`Membuat divisi baru 'Teknologi Informasi' dengan ID: ${divisionId}`);
          }

          // Upsert data user ke database
          await pgClient.query(`
            INSERT INTO users (id, email, full_name, nip, role, division_id, mfa_enabled)
            VALUES ($1, $2, $3, $4, $5::app_role, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              full_name = EXCLUDED.full_name,
              nip = EXCLUDED.nip,
              role = EXCLUDED.role,
              division_id = EXCLUDED.division_id,
              mfa_enabled = EXCLUDED.mfa_enabled;
          `, [userId, admin.email, admin.full_name, admin.nip, 'ADMIN', divisionId, true]);

          pgClient.release();
          console.log(`Sukses sinkronisasi database online untuk ${admin.email}!`);
        } catch (dbErr) {
          console.error(`Gagal sinkronisasi ke database online (mungkin port diblokir jaringan):`, dbErr.message);
        }
      }
    }
  } catch (err) {
    console.error("Terjadi error sistem:", err.message);
  } finally {
    if (pgPool) {
      await pgPool.end();
    }
    console.log("\nProses pendaftaran admin selesai.");
  }
}

registerAdmins();
