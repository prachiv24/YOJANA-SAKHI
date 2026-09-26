// lib/supabase.js
//
// Server-side Supabase client used by the agent tool-executor.
// Uses the SERVICE ROLE key (never expose this to the browser / never
// prefix it with NEXT_PUBLIC_) so the backend can read/write citizen
// profiles regardless of row-level-security policies.
//
// If the env vars aren't set yet, `supabase` is null and the app falls
// back to in-memory storage (see agents/tool-executor.js) so local dev
// still works before you've wired up Supabase.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

if (!supabase && process.env.NODE_ENV !== "production") {
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing — " +
      "falling back to in-memory storage. Set both in .env.local to persist data."
  );
}
