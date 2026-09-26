// app/api/schemes/browse/route.js
//
// Paginated listing of the FULL ingested corpus (data/corpus -> scripts/ingest-schemes.js
// -> scheme_documents), independent of the ~30 schemes in data/schemes.js. Scheme
// Discovery's default view (no search query typed) calls this so a large ingested
// corpus (e.g. 3,000+ myScheme entries) is actually browsable, not just reachable
// by typing a matching search query.
//
//   curl "http://localhost:3000/api/schemes/browse?page=1&pageSize=24"

import { NextResponse } from "next/server";
import { listSchemeDocuments } from "../../../../lib/ragSearch.js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 24));
    const state = searchParams.get("state") || null;
    const category = searchParams.get("category") || null;

    const result = await listSchemeDocuments({ page, pageSize, state, category });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Scheme browse route error:", err);
    return NextResponse.json({ status: "error", message: "Browse failed." }, { status: 500 });
  }
}
