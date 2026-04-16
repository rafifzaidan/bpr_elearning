import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client using SERVICE_ROLE_KEY.
 * ONLY use this on the server side (Server Actions / API Routes).
 * This client bypasses RLS and can manage Auth users.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
