# RAG layer — setup and design notes

This is the retrieval-augmented layer that lets the assistant answer general, free-text questions
about government schemes ("is there a scheme for disabled farmers in Bihar", "what documents does
a caste certificate need") — separate from and never overriding the deterministic eligibility
engine in `lib/eligibility.js`, which is the only thing allowed to decide whether a citizen
qualifies for something.

## Why this design

- **Vector store: Supabase pgvector**, not a separate vector database (e.g. Pinecone). The full
  target corpus (myScheme.gov.in's ~4,700 schemes) is small by vector-search standards — Postgres
  with pgvector handles it comfortably, and it avoids adding a second stateful service to an
  already-Supabase-backed app. A dedicated vector DB is the right call at a scale (hundreds of
  thousands+ of documents, sub-10ms latency requirements) this project doesn't have.
- **Embeddings: Gemini `gemini-embedding-001`**, not a separate provider — reuses the existing
  `GEMINI_API_KEY`, so there's no new account, no new billing relationship, and no new dependency
  in `package.json`.
- **Retrieval is advisory, not authoritative.** `search_schemes` (the tool the planner can call —
  see `agents/tools.js`) returns text excerpts and explicitly cannot be used by the LLM to declare
  eligibility; see the rule in `agents/system-prompt.js`. `agents/plannerV2.js` (the BTP's V2
  baseline) calls the same `lib/ragSearch.js` function directly, without a tool-calling loop —
  useful for the V2-vs-V3 comparison, since both are grounded by identical retrieval, and any
  accuracy difference between them isolates the effect of the deterministic eligibility engine
  and tool loop rather than retrieval quality. This mirrors the same separation of
  concerns as V3's core design: LLM plans and explains, deterministic code decides.
- **Graceful degradation, in tiers.** Consistent with the rest of the codebase (`lib/supabase.js`
  already does this for citizen profiles): `lib/ragSearch.js` never lets a transient failure (an
  embedding API rate limit or error) silently fall all the way back to the tiny 30-scheme seed
  corpus when the real ingested corpus is right there. The order is: (1) vector search, (2)
  indexed Postgres full-text search over the same real `scheme_documents` table if embedding
  fails, (3) an unindexed keyword scan over the same table if the full-text RPC isn't installed
  yet, (4) the bundled seed corpus — only if Supabase itself isn't configured or is unreachable.
  See the module comment at the top of `lib/ragSearch.js` for the full reasoning.

## One-time setup

1. **Enable pgvector and create the schema.** Open your Supabase project → SQL Editor → paste and
   run `db/rag_schema.sql`. This enables the `vector` extension, creates the `scheme_documents`
   table, and defines the `match_scheme_documents` similarity-search function.

2. **Ingest the bundled corpus** — `data/corpus/myscheme-schemes.json`, ~3,400 real schemes
   scraped from myScheme.gov.in (title, state/level, category, description, eligibility,
   benefits, application process, and required documents per scheme). This is the default now —
   no external dataset to go find:
   ```bash
   node scripts/ingest-schemes.js
   ```
   This takes a while (one embedding API call per scheme, rate-limited to stay under free-tier
   quota) — expect it to run for tens of minutes on the full corpus. It prints progress as it
   goes. A handful of exact-duplicate rows in the source data are automatically skipped.

   If you just want a fast smoke test instead, ingest the tiny 30-scheme demo corpus (the same
   30 schemes `data/schemes.js` has structured eligibility rules for):
   ```bash
   node scripts/ingest-schemes.js data/corpus/seed-corpus.json
   ```

3. **Verify it's working:**
   ```bash
   curl -X POST http://localhost:3000/api/schemes/search \
     -H "Content-Type: application/json" \
     -d '{"query": "widow pension income certificate"}'
   ```
   The response's `"mode"` field will say `"vector"` once ingestion has run successfully,
   `"keyword-db"` if embedding failed but it still searched the real ingested table (full-text or
   ILIKE — see `lib/ragSearch.js`), or `"keyword"` if it fell all the way back to the bundled seed
   corpus (check your `.env.local` and the Supabase table if you expect `"vector"` but see
   `"keyword"`).

4. **Browse it in the app** — Scheme Discovery's "Full scheme database" section (shown whenever
   the search box is empty) paginates through everything you've ingested via
   `app/api/schemes/browse/route.js` / `lib/ragSearch.js`'s `listSchemeDocuments()`, independent
   of search.

## State field caveat

The bundled corpus's `level` field is "Central" or "State" — which *tier* of government runs the
scheme — not the actual state name. `scripts/ingest-schemes.js` does a light substring match
against a list of Indian states/UTs in each scheme's description text to recover the real state
for state-level schemes (~2,672 of 2,859 state schemes resolved this way in testing; the
remaining ~187 are left with `state: null` — still fully searchable, just not filterable by
state). This is a heuristic, not authoritative data — good enough for retrieval, but don't treat
it as a verified state assignment in your report without spot-checking a sample.

## Scaling beyond the bundled corpus

3,400 real schemes is enough for a genuine comparison-evaluation corpus, not just a pipeline
smoke test — this is what you should point `scripts/evaluate.js` and your report at. If you want
more (myScheme.gov.in itself lists closer to ~4,700):

1. Get a fuller myScheme.gov.in scrape/dataset — e.g. the `shrijayan/gov_myscheme` dataset on
   Hugging Face. (Check its license/terms before including it in your BTP submission's dataset
   appendix — the bundled `data/corpus/myscheme-schemes.json` is included here on the same basis
   as any other academic-project dataset use; cite your source in your report.)

2. Drop the file under `data/corpus/` and run:
   ```bash
   node scripts/ingest-schemes.js data/corpus/your-file.json
   ```
   `normalizeRecord()` in that script already adapts both this project's own shape and the
   bundled corpus's field names (`scheme_name`, `slug`, `details`, `eligibility`, `application`,
   `documents`, `level`, `schemeCategory`) plus a few other common variants
   (`schemeName`/`title`/`name`, `eligibilityCriteria`, `officialLink`/`applicationUrl`, etc.). If
   your file uses still-different field names, that function is where to add them.

3. Ingestion is rate-limited to stay under free-tier embedding quota — see `delayMs` in
   `lib/embeddings.js` if you need to tune it. Run it once, not on every deploy.

4. After a large ingest, run `analyze scheme_documents;` in the Supabase SQL editor so the
   `ivfflat` index's query planner statistics are up to date.

## Files

| File | Role |
|---|---|
| `db/rag_schema.sql` | One-time Supabase schema (pgvector extension, table, search RPC) |
| `lib/embeddings.js` | Gemini `gemini-embedding-001` wrapper (ingest-time and query-time) |
| `lib/ragSearch.js` | Search + browse entry points — vector search and paginated listing, both with a keyword/seed-corpus fallback |
| `data/corpus/myscheme-schemes.json` | Bundled real corpus — ~3,400 schemes scraped from myScheme.gov.in. Default ingestion target. |
| `data/corpus/seed-corpus.json` | Tiny 30-scheme demo corpus, auto-generated from `data/schemes.js` — used as the keyword-search fallback when Supabase isn't configured, and as a fast smoke-test target |
| `scripts/ingest-schemes.js` | CLI: embed + upsert a corpus JSON file into Supabase |
| `scripts/select-priority-schemes.js` | CLI: ranks un-verified schemes by an explainable impact proxy, for growing the verified list |
| `scripts/draft-eligibility-rules.js` | CLI: LLM-drafts (not verifies) structured eligibility rules for priority candidates — human review required before promotion |
| `data/verifiedSchemeIds.js` | Single source of truth for which scheme ids are in the verified tier |
| `agents/tools.js` / `tool-executor.js` | `search_schemes` tool definition + execution |
| `app/api/schemes/search/route.js` | Standalone HTTP endpoint for semantic search, outside chat |
| `app/api/schemes/browse/route.js` | Paginated listing of the full ingested corpus, no query needed — what Scheme Discovery's default view calls |
| `lib/estimateEligibility.js` | LLM-based best-effort eligibility read for RAG-only schemes (no structured rules) — always labeled as an estimate, never merged with the deterministic engine's output |
| `app/api/schemes/estimate-eligibility/route.js` | Endpoint for the above — loads the citizen's saved profile server-side, takes the scheme's text from the client |
| `hooks/useSchemeEstimate.js` / `components/EstimateBlock.js` | Shared client-side state + UI for the estimate flow — used by both Scheme Discovery and the Eligibility Check page |

## Growing the verified list beyond ~30 schemes

`data/schemes.js`'s ~30 schemes get a deterministic, hand-verified eligibility checker
(`lib/eligibility.js`) — the highest-confidence tier this project offers. The other ~3,400
ingested schemes only get `lib/estimateEligibility.js`'s LLM best-effort read, clearly labeled
"Preliminary estimate, not verified" in the UI (see `components/EstimateBlock.js`).

Hand-authoring structured rules for all ~3,400 schemes isn't realistic for a project this size —
it's real domain-verification work (reading each scheme's actual official notification, not just
its scraped text), not a scripting problem. The plan instead is to grow the verified tier toward
the schemes that matter most, using tooling that drafts candidates but never auto-promotes them:

1. **`node scripts/select-priority-schemes.js [count]`** — ranks candidates from the already-
   ingested corpus by an explainable proxy for impact (central-level, name matches a recognizable
   "flagship" scheme keyword, has enough eligibility text to draft from, not already verified).
   No network or API key needed — it only filters/ranks data you already have. Writes
   `data/corpus/priority-schemes.json`.

2. **`node scripts/draft-eligibility-rules.js [batchSize] [startIndex]`** — for each candidate,
   asks Gemini to draft a rule tree in the exact shape `lib/eligibility.js` expects, grounded in
   that scheme's own scraped eligibility text (not the model's general knowledge). Every draft is
   tagged `verified: false, needsReview: true` and includes the original source text alongside
   the drafted rules, plus a list of anything the draft couldn't confidently encode
   (`uncoveredConditions`) — so a reviewer isn't starting from a blank page, but also isn't shown
   a false sense of completeness. Resumable across batches. Requires `GEMINI_API_KEY`. Writes
   `data/corpus/draft-eligibility-rules.json`.

3. **Human review, one scheme at a time** — check each draft against the scheme's actual official
   guidelines (not just the scraped text, which can itself be incomplete or wrong), correct
   anything off, then move it into `data/schemes.js` in the same shape as the existing 30 and add
   its id to `data/verifiedSchemeIds.js`. Only after this step does a scheme earn the "✓ Verified"
   badge — nothing in this pipeline promotes a draft automatically.

This keeps the two-tier design honest as the verified list grows: "Verified" always means a human
checked it against the actual scheme rules, and "Preliminary" always means it didn't go through
that step yet — never a UI label papering over which is which.



If `data/schemes.js` changes and you want `data/corpus/seed-corpus.json` to reflect it, the
conversion logic is a short script (not checked in, since it's a one-off) that imports `SCHEMES`
and maps each entry's `eligibility.rules`, `requiredDocuments`, etc. into a flat `content` string.
Recreate it if needed, or just hand-edit the JSON for small changes.
