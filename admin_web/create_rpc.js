const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.tqskhwdcofsxomtjpctw:Georgiza123.@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

const sql = `
CREATE OR REPLACE FUNCTION get_login_email_by_nip(p_nip text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM public.users WHERE nip = p_nip LIMIT 1;
  IF v_email IS NULL OR v_email = '' THEN
    RETURN p_nip || '@bpr-jatim.internal';
  ELSE
    RETURN v_email;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_login_email_by_nip(text) TO anon, authenticated;
`;

pool.query(sql)
  .then(() => {
    console.log('✅ RPC get_login_email_by_nip created successfully!');
    pool.end();
  })
  .catch(e => {
    console.error('❌ Error creating RPC:', e);
    pool.end();
  });
