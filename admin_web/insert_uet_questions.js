const fs = require('fs');
const path = require('path');
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
if (!databaseUrl) {
  console.error("DATABASE_URL tidak ditemukan di .env!");
  process.exit(1);
}

const questionsData = [
  {
    text: "Apa tujuan utama dari dilaksanakannya User Evaluation Test (UET) pada aplikasi?",
    weight: 1,
    correct_ans: "A",
    options: {
      A: "Mengevaluasi fungsi dan antarmuka aplikasi",
      B: "Menguji kecepatan download database",
      C: "Menghitung kapasitas penyimpanan server",
      D: "Menilai performa hardware laptop"
    }
  },
  {
    text: "Di bawah ini yang merupakan hak akses dari administrator pada Portal Web adalah...",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Mengerjakan kuis evaluasi",
      B: "Mengelola materi, pegawai, kuis, dan pantau nilai",
      C: "Membaca modul lewat mobile",
      D: "Mengubah logo instansi BPR"
    }
  },
  {
    text: "Bagaimana cara kerja fitur offline/bypass pada aplikasi saat Supabase terputus?",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Aplikasi langsung force close",
      B: "Aplikasi menggunakan simulasi memori lokal (mock state)",
      C: "Data tidak bisa disimpan sama sekali",
      D: "Browser otomatis me-restart laptop"
    }
  },
  {
    text: "Berapakah durasi pengerjaan yang diset pada kuis pengujian UET ini?",
    weight: 1,
    correct_ans: "C",
    options: {
      A: "60 menit",
      B: "45 menit",
      C: "15 menit",
      D: "30 menit"
    }
  },
  {
    text: "Jika opsi 'Bisa dikerjakan ulang' diaktifkan oleh admin, apa yang bisa dilakukan karyawan?",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Karyawan tidak bisa mengikuti kuis lagi",
      B: "Karyawan dapat mengulang kuis untuk memperbaiki nilai",
      C: "Ujian otomatis terhapus",
      D: "Akun karyawan otomatis terblokir"
    }
  },
  {
    text: "Divisi apa saja yang ditugaskan untuk mengikuti Modul Pengujian UET ini?",
    weight: 1,
    correct_ans: "A",
    options: {
      A: "Akuntansi dan Teknologi Informasi",
      B: "Hanya Pemasaran",
      C: "Operasional dan SDM",
      D: "Seluruh divisi BPR kecuali TI"
    }
  },
  {
    text: "Apa format file materi pembelajaran yang didukung untuk diunggah pada portal?",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "DOCX dan XLSX",
      B: "PDF dan Video (MP4)",
      C: "ZIP dan RAR",
      D: "PPTX saja"
    }
  },
  {
    text: "Fungsi utama dari menu 'Pantau Nilai Karyawan' bagi admin PSDM adalah...",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Mengubah jawaban kuis karyawan",
      B: "Memonitor skor, status kelulusan, dan mengekspor laporan nilai",
      C: "Mengirim email spam ke karyawan",
      D: "Menghapus akun karyawan secara acak"
    }
  },
  {
    text: "Di bawah ini, manakah password pengujian default yang digunakan untuk bypass login offline?",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "admin123",
      B: "AdminPassword123!",
      C: "passwordku",
      D: "BPRJatim2026"
    }
  },
  {
    text: "Fitur keamanan MFA pada data pegawai berfungsi untuk memverifikasi login menggunakan...",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Sidik jari (Fingerprint)",
      B: "Kode OTP yang dikirim ke Email",
      C: "Scan wajah (Face ID)",
      D: "Pertanyaan keamanan masa kecil"
    }
  }
];

async function run() {
  console.log("Menghubungkan ke PostgreSQL database...");
  const pool = new pg.Pool({ connectionString: databaseUrl });
  
  try {
    const client = await pool.connect();
    
    // 1. Cari modul dengan nama "test uet"
    const modulesRes = await client.query(`
      SELECT id, title FROM public.modules 
      WHERE LOWER(title) LIKE '%test uet%' OR LOWER(title) LIKE '%uet%'
    `);
    
    console.log(`Menemukan ${modulesRes.rows.length} modul pengujian UET di database.`);
    
    for (const mod of modulesRes.rows) {
      console.log(`\nMemproses modul ID ${mod.id}: "${mod.title}"...`);
      
      // Hapus soal lama jika ada agar tidak duplikat
      await client.query('DELETE FROM public.questions WHERE module_id = $1', [mod.id]);
      console.log("Menghapus soal-soal lama (jika ada)...");
      
      // Insert 10 soal baru
      for (const q of questionsData) {
        await client.query(`
          INSERT INTO public.questions (module_id, text, options, correct_ans, weight, set_name)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [mod.id, q.text, JSON.stringify(q.options), q.correct_ans, q.weight, 'Default']);
      }
      console.log(`Sukses memasukkan 10 soal baru untuk modul "${mod.title}"!`);
    }
    
    client.release();
  } catch (err) {
    console.error("Terjadi error saat memasukkan data ke database:", err.message);
  } finally {
    await pool.end();
    console.log("\nProses selesai.");
  }
}

run();
