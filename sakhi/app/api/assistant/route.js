// app/api/assistant/route.js
//
// Single mode-switched endpoint the frontend talks to for every "small AI"
// helper task: explaining eligibility gaps, OCR fallback questions,
// document checklist tips, post-application next steps, and — most
// importantly for the document upload flow — cross-checking OCR-extracted
// document fields against the citizen's saved profile
// (see components/DocumentUpload.js -> client/useAssistant.js -> here).
//
// Every mode degrades gracefully: if Gemini errors out (missing key, rate
// limit, bad response), we return { result: null, fallback: true } with a
// 200 status so the UI's own static fallback text kicks in instead of a
// hard failure. See server/assistantService.js for the actual prompts.

import { NextResponse } from "next/server";
import {
  explainEligibilityGap,
  ocrFallbackQuestion,
  parseFallbackAnswer,
  annotateDocumentChecklist,
  explainNextSteps,
  verifyDocumentMatch,
} from "../../../server/assistantService.js";

const HANDLERS = {
  "explain-gap": explainEligibilityGap,
  "ocr-fallback-question": ocrFallbackQuestion,
  "parse-fallback-answer": parseFallbackAnswer,
  "doc-checklist": annotateDocumentChecklist,
  "next-steps": explainNextSteps,
  "verify-document": verifyDocumentMatch,
};

export async function POST(req) {
  let mode, payload;

  try {
    const body = await req.json();
    mode = body.mode;
    payload = body.payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!mode || !payload) {
    return NextResponse.json(
      { error: "Missing 'mode' or 'payload' in request body." },
      { status: 400 }
    );
  }

  const handler = HANDLERS[mode];
  if (!handler) {
    return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
  }

  try {
    const result = await handler(payload);
    return NextResponse.json({ result });
  } catch (err) {
    console.error(`Assistant error [${mode}]:`, err?.message || err);
    // Never let this surface as a raw crash in a demo — degrade gracefully.
    // callAssistant() in client/useAssistant.js treats a falsy `result` as
    // "use my static fallback text" for every mode.
    return NextResponse.json({
      result: null,
      fallback: true,
      error: "Assistant temporarily unavailable. Falling back to static text.",
    });
  }
}
