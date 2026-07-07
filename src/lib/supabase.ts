import { createBrowserClient } from "@supabase/ssr";

// Browser client for "use client" pages. Stores the auth session in cookies
// so the middleware can see it. Placeholder fallbacks keep builds working
// without env vars; real requests require the actual values.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
