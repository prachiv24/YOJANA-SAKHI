// app/api/documents/route.js
//
// GET /api/documents?sessionId=...&schemeId=...
// Returns previously verified/uploaded documents for this citizen + scheme,
// so the "Uploaded Documents" page can restore status after a page reload
// instead of always starting from a blank checklist.
//
// Reads straight from the same `citizen_documents` table that
// app/api/ocr/route.js writes to.

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase.js";

export async function GET(req) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const schemeId = req.nextUrl.searchParams.get("schemeId");

  if (!sessionId || !schemeId) {
    return NextResponse.json(
      { error: "sessionId and schemeId are required" },
      { status: 400 }
    );
  }

  // Supabase isn't configured (e.g. local dev without env vars) — the
  // Documents page just starts blank; uploads still work for the session,
  // they simply won't persist across a reload.
  if (!supabase) {
    return NextResponse.json({ documents: [] });
  }

  const { data, error } = await supabase
    .from("citizen_documents")
    .select("document_id, doc_name, verified, ocr_text")
    .eq("session_id", sessionId)
    .eq("scheme_id", schemeId);

  if (error) {
    console.error("Fetch documents error:", error.message);
    return NextResponse.json({ documents: [] });
  }

  return NextResponse.json({ documents: data || [] });
}
