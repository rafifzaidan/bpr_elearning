import { createClient } from "@supabase/supabase-js";

// Guard: this module must NEVER be imported in client components.
// The SUPABASE_SERVICE_ROLE_KEY is a server-only secret.
if (typeof window !== "undefined") {
  throw new Error(
    "supabase-admin.ts must only be imported on the server side. " +
      "Do not import it in Client Components."
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
}
if (!serviceRoleKey) {
  throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Supabase Admin Client using SERVICE_ROLE_KEY.
 * SERVER-SIDE ONLY — bypasses RLS and can manage Auth users.
 * Import ONLY in Server Actions, Route Handlers, or server components.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
