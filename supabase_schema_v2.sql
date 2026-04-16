-- ============================================================
-- BPR E-Learning — Supabase Schema V2
-- Arsitektur: NIP-based auth, Divisi, MFA, Ujian, Hasil
-- ============================================================
-- 
-- INSTRUKSI: Jalankan file ini di Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- --------------------------------------------------------
-- 0. DROP SCHEMA LAMA (Hati-hati: semua data lama hilang!)
-- --------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_is_passed() CASCADE;

DROP TABLE IF EXISTS public.module_user CASCADE;
DROP TABLE IF EXISTS public.results CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.divisions CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;

-- --------------------------------------------------------
-- 1. ENUM Role
-- --------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('EMPLOYEE', 'ADMIN', 'LEADER');

-- --------------------------------------------------------
-- 2. DIVISIONS — Divisi kerja (TI / Akuntansi / dst)
-- --------------------------------------------------------
CREATE TABLE public.divisions (
  id            SERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,
  passing_grade FLOAT NOT NULL DEFAULT 75.0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Contoh data awal divisi
INSERT INTO public.divisions (name, passing_grade) VALUES
  ('Teknologi Informasi', 75.0),
  ('Akuntansi', 75.0);

-- --------------------------------------------------------
-- 3. USERS — Pegawai, terhubung ke Supabase Auth UUID
--    Email di Auth dibuat otomatis: {NIP}@bpr-jatim.internal
-- --------------------------------------------------------
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nip           TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  division_id   INT NOT NULL REFERENCES public.divisions(id),
  role          public.app_role NOT NULL DEFAULT 'EMPLOYEE',
  mfa_enabled   BOOLEAN NOT NULL DEFAULT false,
  must_change_pw BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 4. MODULES — Materi Pembelajaran per Divisi
-- --------------------------------------------------------
CREATE TABLE public.modules (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  file_url    TEXT,            -- URL Supabase Storage (PDF/Video)
  file_type   TEXT,            -- 'pdf' | 'video'
  division_id INT NOT NULL REFERENCES public.divisions(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 5. QUESTIONS — Bank Soal per Modul
-- --------------------------------------------------------
CREATE TABLE public.questions (
  id          SERIAL PRIMARY KEY,
  module_id   INT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  options     JSONB NOT NULL,  -- {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct_ans TEXT NOT NULL,   -- "A" | "B" | "C" | "D"
  weight      INT NOT NULL DEFAULT 1
);

-- --------------------------------------------------------
-- 6. EXAMS — Jadwal Ujian per Modul
-- --------------------------------------------------------
CREATE TABLE public.exams (
  id          SERIAL PRIMARY KEY,
  module_id   INT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 7. RESULTS — Hasil Ujian Pegawai
-- --------------------------------------------------------
CREATE TABLE public.results (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_id     INT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  score       FLOAT NOT NULL,
  is_passed   BOOLEAN,         -- Diisi otomatis oleh trigger
  finished_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, exam_id)    -- Satu user hanya bisa ikut ujian sekali
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- --------------------------------------------------------
-- T1. Auto-hitung is_passed berdasarkan passing_grade divisi
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_is_passed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_passing_grade FLOAT;
BEGIN
  -- Ambil passing_grade dari divisi modul ujian ini
  SELECT d.passing_grade INTO v_passing_grade
  FROM public.exams e
  JOIN public.modules m ON m.id = e.module_id
  JOIN public.divisions d ON d.id = m.division_id
  WHERE e.id = NEW.exam_id;

  -- Set is_passed berdasarkan score vs passing_grade
  NEW.is_passed := NEW.score >= COALESCE(v_passing_grade, 75.0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculate_is_passed
  BEFORE INSERT OR UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.calculate_is_passed();


-- --------------------------------------------------------
-- T2. Auto-insert ke public.users saat Admin buat akun Supabase Auth
--     Web Admin mengirim NIP, full_name, division_id, role via user_metadata
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, nip, full_name, division_id, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nip',
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'division_id')::INT,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'EMPLOYEE')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;


-- ----- DIVISIONS -----
-- Semua login user bisa baca divisi
CREATE POLICY "Anyone can read divisions" ON public.divisions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Hanya ADMIN yang bisa manage divisi (via service_role dari Web Admin)


-- ----- USERS -----

-- Helper function: cek apakah user adalah ADMIN atau LEADER
CREATE OR REPLACE FUNCTION public.is_admin_or_leader()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'LEADER')
  );
$$;

-- Pegawai bisa baca profil sendiri
CREATE POLICY "User can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Admin/Leader bisa baca semua user
CREATE POLICY "Admin can read all users" ON public.users
  FOR SELECT USING (public.is_admin_or_leader());

-- User bisa update status mfa_enabled diri sendiri
CREATE POLICY "User can update own mfa status" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ----- MODULES -----

-- Pegawai hanya bisa melihat modul dari divisinya
CREATE POLICY "Employee sees own division modules" ON public.modules
  FOR SELECT USING (
    division_id = (SELECT division_id FROM public.users WHERE id = auth.uid())
  );

-- Admin/Leader bisa lihat semua modul
CREATE POLICY "Admin sees all modules" ON public.modules
  FOR SELECT USING (public.is_admin_or_leader());


-- ----- QUESTIONS -----

-- Pegawai hanya bisa baca soal dari modul divisinya
CREATE POLICY "Employee sees own division questions" ON public.questions
  FOR SELECT USING (
    module_id IN (
      SELECT m.id FROM public.modules m
      JOIN public.users u ON u.division_id = m.division_id
      WHERE u.id = auth.uid()
    )
  );

-- Admin/Leader bisa lihat semua soal
CREATE POLICY "Admin sees all questions" ON public.questions
  FOR SELECT USING (public.is_admin_or_leader());


-- ----- EXAMS -----

-- Pegawai hanya melihat ujian dari divisinya (dan yang masih aktif)
CREATE POLICY "Employee sees own division exams" ON public.exams
  FOR SELECT USING (
    module_id IN (
      SELECT m.id FROM public.modules m
      JOIN public.users u ON u.division_id = m.division_id
      WHERE u.id = auth.uid()
    )
  );

-- Admin/Leader bisa lihat semua ujian
CREATE POLICY "Admin sees all exams" ON public.exams
  FOR SELECT USING (public.is_admin_or_leader());


-- ----- RESULTS -----

-- Pegawai hanya bisa lihat & insert hasil ujian sendiri
CREATE POLICY "User sees own results" ON public.results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can submit own result" ON public.results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin/Leader bisa lihat semua hasil
CREATE POLICY "Admin sees all results" ON public.results
  FOR SELECT USING (public.is_admin_or_leader());


-- ============================================================
-- SUPABASE STORAGE — Bucket untuk file Modul (PDF/Video)
-- ============================================================
-- Jalankan via Supabase Dashboard → Storage → New Bucket
-- Atau uncomment baris berikut jika menggunakan Supabase CLI:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('modules', 'modules', false);
--
-- CREATE POLICY "Authenticated users can read module files" ON storage.objects
--   FOR SELECT USING (bucket_id = 'modules' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Admins can upload module files" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'modules' AND public.is_admin_or_leader());


-- ============================================================
-- SELESAI
-- ============================================================
-- Langkah selanjutnya:
-- 1. Buka Supabase Dashboard → Storage → Buat bucket "modules" (private)
-- 2. Di Authentication → MFA → Aktifkan TOTP (sudah diaktifkan)
-- 3. Admin pertama: Buat manual via Supabase Auth dengan email 
--    {NIP}@bpr-jatim.internal dan set role = ADMIN di tabel users
-- ============================================================
