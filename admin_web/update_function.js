const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const query = `
CREATE OR REPLACE FUNCTION public.calculate_is_passed()
RETURNS TRIGGER AS $$
DECLARE
  v_passing_grade FLOAT;
BEGIN
  -- Ambil passing_grade dari divisi user yang mengerjakan ujian ini
  SELECT d.passing_grade INTO v_passing_grade
  FROM public.users u
  JOIN public.divisions d ON d.id = u.division_id
  WHERE u.id = NEW.user_id;

  -- Set is_passed berdasarkan score vs passing_grade
  NEW.is_passed := NEW.score >= COALESCE(v_passing_grade, 75.0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

async function run() {
  try {
    await pool.query(query);
    console.log("✅ Function calculate_is_passed updated successfully!");
  } catch (err) {
    console.error("❌ Error updating function:", err);
  } finally {
    await pool.end();
  }
}
run();
