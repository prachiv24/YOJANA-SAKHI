// app/api/schemes/estimate-eligibility/route.js
//
// AI-estimated eligibility for a scheme that only exists in the RAG corpus (no
// structured rules in data/schemes.js). Loads the citizen's already-saved profile
// (same one the Eligibility page and chat agent share — see app/api/profile/route.js)
// and asks lib/estimateEligibility.js for a best-effort verdict.
//
// The scheme's title/content are passed directly from the client (whatever card
// the citizen clicked already has this in memory from search/browse) rather than
// re-fetched server-side by id — search results (vector or keyword-fallback) and
// browse results don't share one consistent id shape, so this sidesteps that
// entirely rather than adding a fragile lookup.
//
//   curl -X POST http://localhost:3000/api/schemes/estimate-eligibility \
//     -H "Content-Type: application/json" \
//     -d '{"sessionId":"...", "schemeTitle":"...", "schemeContent":"..."}'

import { NextResponse } from "next/server";
import { loadCitizenProfile } from "../../../../agents/tool-executor.js";
import { estimateSchemeEligibility } from "../../../../lib/estimateEligibility.js";

export async function POST(req) {
  try {
    const { sessionId, schemeTitle, schemeContent } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (!schemeTitle || !schemeContent) {
      return NextResponse.json({ error: "schemeTitle and schemeContent are required" }, { status: 400 });
    }

    const profile = await loadCitizenProfile(sessionId);

    if (!profile || Object.keys(profile).length === 0) {
      return NextResponse.json(
        { error: "No saved profile for this session yet — fill in the Eligibility Check page first so there's something to estimate against." },
        { status: 400 }
      );
    }

    const estimate = await estimateSchemeEligibility(profile, { title: schemeTitle, content: schemeContent });

    if (estimate.error) {
      return NextResponse.json({ error: estimate.error }, { status: 502 });
    }

    return NextResponse.json(estimate);
  } catch (err) {
    console.error("Estimate-eligibility route error:", err);
    return NextResponse.json({ error: "Could not run the estimate." }, { status: 500 });
  }
}
