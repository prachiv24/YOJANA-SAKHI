// lib/supabaseClient.js
//
// Browser-side Supabase client — uses the PUBLIC anon key (safe to expose;
// it's protected by Row Level Security on Supabase's end), unlike
// lib/supabase.js which holds the server-only service role key and must
// never be imported into a "use client" file.
//
// This client is used only for Supabase Auth (sign up / log in / log out /
// session listening) in context/SessionContext.js and the login/signup
// pages. All other data reads/writes still go through your existing API
// routes -> lib/supabase.js on the server, unchanged.

import { createClient } from "@supabase/supabase-js";

// Trim in case the value was pasted with surrounding quotes/whitespace in
// .env.local (a common source of "Failed to fetch" — the URL ends up
// malformed, e.g. "https://xyz.supabase.co"  with trailing quote chars).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function isValidSupabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const hasValidConfig =
  !!supabaseUrl && !!supabaseAnonKey && isValidSupabaseUrl(supabaseUrl);

export const supabaseClient = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!hasValidConfig && typeof window !== "undefined") {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[supabaseClient] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing — " +
        "login/signup won't work until both are set in .env.local, and the dev server " +
        "has been restarted (Next.js only reads env vars at startup)."
    );
  } else if (!isValidSupabaseUrl(supabaseUrl)) {
    console.warn(
      `[supabaseClient] NEXT_PUBLIC_SUPABASE_URL ("${supabaseUrl}") doesn't look like a valid ` +
        'https URL (it should look like "https://xxxxxxxx.supabase.co", with no quotes or ' +
        "trailing slash) — login/signup won't work until it's fixed."
    );
  }
}
