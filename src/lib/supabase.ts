import { createClient } from "@supabase/supabase-js";

// Fall back to placeholders so the app can build without env vars
// (e.g. CI, first deploy). API routes check for real config at request time.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseKey);
