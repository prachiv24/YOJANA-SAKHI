// app/api/schemes/search/route.js
//
// Direct semantic search over the scheme corpus, outside the chat/agent
// flow — handy for wiring into app/scheme-discovery/page.js, or for
// manually verifying RAG is working:
//
//   curl -X POST http://localhost:3000/api/schemes/search \
//     -H "Content-Type: application/json" \
//     -d '{"query": "scholarships for disabled students in Bihar"}'
//
// See agents/tool-executor.js's "search_schemes" case for the same search
// used inside a chat turn — this route and that tool call the same
// lib/ragSearch.js underneath, so results are consistent either way.

import { NextResponse } from "next/server";
import { searchSchemeDocuments } from "../../../../lib/ragSearch.js";

export async function POST(req) {
  try {
    const { query, state, matchCount } = await req.json();

    if (!query || !String(query).trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const { mode, results } = await searchSchemeDocuments(String(query).trim(), {
      matchCount: Number(matchCount) > 0 ? Number(matchCount) : 5,
      state: state || null,
    });

    // Normalize to camelCase — vector-mode results come straight from the Supabase RPC
    // (snake_case columns), keyword-fallback results come from the corpus loader (also
    // snake_case) — the scheme-discovery page reads camelCase fields (schemeId, excerpt,
    // sourceUrl), so map here once rather than in every caller.
    const normalized = results.map((r) => ({
      schemeId: r.scheme_id ?? r.schemeId ?? null,
      title: r.title,
      state: r.state,
      category: r.category,
      sourceUrl: r.source_url ?? r.sourceUrl ?? null,
      excerpt: r.content ?? r.excerpt,
    }));

    return NextResponse.json({ status: "ok", mode, results: normalized });
  } catch (err) {
    console.error("Scheme search route error:", err);
    return NextResponse.json({ status: "error", message: "Search failed." }, { status: 500 });
  }
}
