const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://tqskhwdcofsxomtjpctw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxc2tod2Rjb2ZzeG9tdGpwY3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUyNDEzMywiZXhwIjoyMDkwMTAwMTMzfQ.W8JiMbARFpcq0s8nH39bnaX5MDZjSUIdugou0bLsLn4"; // SERVICE ROLE KEY

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('divisions').select('*');
  if (error) {
    console.error('Error fetching divisions:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
main();
