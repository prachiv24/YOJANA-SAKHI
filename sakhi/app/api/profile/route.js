// app/api/profile/route.js
//
// Lets the Eligibility Check page load/save a citizen's profile directly,
// without going through the chat agent. Reuses the exact same
// load/saveCitizenProfile helpers the chat tools use (agents/tool-executor.js)
// so a profile built in the chat and a profile built via the form stay
// in sync — both read/write the same Supabase row (or in-memory fallback).

import { NextResponse } from "next/server";
import {
  loadCitizenProfile,
  saveCitizenProfile,
} from "../../../agents/tool-executor.js";

export async function GET(req) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const profile = await loadCitizenProfile(sessionId);
  return NextResponse.json({ profile });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId, ...fields } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const profile = await saveCitizenProfile(sessionId, fields);
    return NextResponse.json({ status: "saved", profile });
  } catch (err) {
    console.error("Profile save error:", err);
    return NextResponse.json({ error: "Could not save profile." }, { status: 500 });
  }
}
