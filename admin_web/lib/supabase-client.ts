import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Supabase Browser Client using ANON key.
 * Safe to use in both Client and Server Components.
 * Respects Row Level Security (RLS).
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
