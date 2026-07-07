import { createClient } from "@supabase/supabase-js";

// Server-side client for API routes and crons. Uses the secret key
// (bypasses RLS) when configured; falls back to the anon key so the app
// still works before the RLS lockdown migration has been applied.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
