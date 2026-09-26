// app/api/saved-schemes/route.js
// Save, unsave, and list bookmarked schemes for a session — works for both the
// local 30 (scheme_id is one of data/schemes.js's ids) and RAG-corpus schemes
// (scheme_id is a slug/title-derived id; title/source_url are stored alongside
// since those rows don't exist in data/schemes.js for the saved-schemes page to
// look up display info from).
//
// Requires db/saved_schemes_rag_migration.sql to have been run once (adds the
// nullable title/source_url columns) — existing rows without them still work
// fine, this only affects newly-saved RAG schemes.

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase.js";

export async function POST(req) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase isn't configured — can't save schemes yet." }, { status: 503 });
  }

  try {
    const { sessionId, schemeId, title = null, sourceUrl = null } = await req.json();

    if (!sessionId || !schemeId) {
      return NextResponse.json(
        { error: "sessionId and schemeId are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("saved_schemes")
      .upsert(
        { session_id: sessionId, scheme_id: schemeId, title, source_url: sourceUrl },
        { onConflict: "session_id,scheme_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Save scheme error:", error);
      return NextResponse.json({ error: "Could not save scheme" }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved: data });
  } catch (err) {
    console.error("Saved-schemes POST error:", err.message);
    return NextResponse.json({ error: "Could not save scheme" }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase isn't configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const schemeId  = searchParams.get("schemeId");

    if (!sessionId || !schemeId) {
      return NextResponse.json(
        { error: "sessionId and schemeId are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("saved_schemes")
      .delete()
      .eq("session_id", sessionId)
      .eq("scheme_id", schemeId);

    if (error) {
      console.error("Unsave scheme error:", error);
      return NextResponse.json({ error: "Could not remove scheme" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Saved-schemes DELETE error:", err.message);
    return NextResponse.json({ error: "Could not remove scheme" }, { status: 500 });
  }
}

export async function GET(req) {
  if (!supabase) {
    return NextResponse.json({ savedSchemes: [] });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("saved_schemes")
      .select("*")
      .eq("session_id", sessionId)
      .order("saved_at", { ascending: false });

    if (error) {
      console.error("Saved-schemes fetch error:", error);
      return NextResponse.json({ error: "Could not load saved schemes" }, { status: 500 });
    }

    return NextResponse.json({ savedSchemes: data || [] });
  } catch (err) {
    console.error("Saved-schemes GET error:", err.message);
    return NextResponse.json({ error: "Could not load saved schemes" }, { status: 500 });
  }
}
