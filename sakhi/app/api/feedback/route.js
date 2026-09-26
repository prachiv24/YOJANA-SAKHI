// app/api/feedback/route.js
//
// Stores citizen feedback in Supabase's `app_feedback` table when Supabase
// is configured. If the table doesn't exist yet, or Supabase isn't
// configured, we log it server-side and still return success — feedback
// should never dead-end into an error page for the citizen submitting it.
//
// Suggested table (run once in the Supabase SQL editor):
//   create table app_feedback (
//     id uuid primary key default gen_random_uuid(),
//     session_id text,
//     rating int,
//     category text,
//     message text,
//     created_at timestamptz default now()
//   );

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase.js";

export async function POST(req) {
  try {
    const { sessionId, rating, category, message } = await req.json();

    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    if (supabase) {
      const { error } = await supabase.from("app_feedback").insert({
        session_id: sessionId || null,
        rating: Number(rating) || null,
        category: category || "other",
        message: String(message).trim(),
      });

      if (error) {
        // Table probably doesn't exist yet in this Supabase project — log
        // it so it's visible in Vercel/terminal logs, but still tell the
        // citizen it went through so a schema hiccup doesn't block them.
        console.error("Feedback insert error:", error.message);
      }
    } else {
      console.log("[feedback] (no Supabase configured) received:", {
        sessionId,
        rating,
        category,
        message,
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Feedback route error:", err);
    // Still 200 — see note above.
    return NextResponse.json({ status: "ok", stored: false });
  }
}
