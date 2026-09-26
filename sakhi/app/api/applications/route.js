// app/api/applications/route.js
// Creates an application record once all required documents are verified,
// and lists a session's applications for the Track Applications page.

import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase.js";

export async function POST(req) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase isn't configured — can't record applications yet." }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { sessionId, schemeId, schemeName } = body;

    if (!sessionId || !schemeId) {
      return NextResponse.json(
        { error: "sessionId and schemeId are required" },
        { status: 400 }
      );
    }

    // Snapshot the citizen's profile at time of applying
    const { data: profile } = await supabase
      .from("citizen_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    // Snapshot the verified documents at time of applying
    const { data: docs } = await supabase
      .from("citizen_documents")
      .select("*")
      .eq("session_id", sessionId)
      .eq("scheme_id", schemeId);

    const { data, error } = await supabase
      .from("applications")
      .upsert(
        {
          session_id:         sessionId,
          scheme_id:          schemeId,
          scheme_name:        schemeName || schemeId,
          status:             "submitted",
          profile_snapshot:   profile || null,
          documents_snapshot: docs || [],
          applied_at:         new Date().toISOString(),
        },
        { onConflict: "session_id,scheme_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Application insert error:", error);
      return NextResponse.json(
        { error: "Could not submit application. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, application: data });
  } catch (err) {
    console.error("Applications route error:", err.message);
    return NextResponse.json(
      { error: "Could not submit application. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  if (!supabase) {
    return NextResponse.json({ applications: [] });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("session_id", sessionId)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("Applications fetch error:", error);
      return NextResponse.json({ error: "Could not load applications" }, { status: 500 });
    }

    return NextResponse.json({ applications: data || [] });
  } catch (err) {
    console.error("Applications GET error:", err.message);
    return NextResponse.json({ error: "Could not load applications" }, { status: 500 });
  }
}