# What changed in this pass

Your two uploads (`yojana-sakhi.zip` = `data/`, `lib/`, `hooks/`, `server/`, `types/`, `scripts/`,
and `dele.zip` = the Next.js `app/`, `components/`, `agents/`, `client/`, `context/`) are two
halves of one project — they've been merged into a single working app. Nothing that was already
working was rewritten; the changes below are additive or bug fixes.

## 1. OCR → AI document verification, actually wired end-to-end

This was the main gap: your frontend (`DocumentUpload.js`) and your AI logic
(`server/assistantService.js`, six functions including `verifyDocumentMatch`) already existed,
but there was no live bridge between them.

- **`app/api/assistant/route.js` (new)** — the actual Next.js endpoint your frontend already
  calls via `client/useAssistant.js`. It didn't exist before; only a commented-out Express
  version (`server/assistantRoute.js`) did. Every mode (`explain-gap`, `ocr-fallback-question`,
  `parse-fallback-answer`, `doc-checklist`, `next-steps`, `verify-document`) is dispatched here.
- **`server/assistantService.js` (rewritten)** — was CommonJS (`module.exports`/`require`) calling
  the raw Anthropic API with a key (`ANTHROPIC_API_KEY`) that isn't in your `.env`. Converted to
  ES modules (your `package.json` has `"type": "module"`) and switched to the **same Gemini
  client and key you already use** in `agents/planner.js`, so it works with zero new setup.
- **`components/DocumentUpload.js`** — fixed a fetch to `/api/citizen-profile`, a route that
  never existed; it now correctly hits `/api/profile`. This is what loads your saved name/DOB/
  income so `verifyDocumentMatch` has something to cross-check the OCR result against.

**Live flow now:** upload a document → `/api/ocr` (Gemini Vision) extracts fields → if verified,
`DocumentUpload` calls `verifyDocument()` → `/api/assistant` (`verify-document` mode) →
`verifyDocumentMatch` compares the OCR fields against your saved profile and flags real
mismatches (critical: name/DOB; minor: small numeric variance) directly under that document row.

- Added the missing CSS for that mismatch banner (`.doc-crosscheck*`) and the apply/submit
  section (`.doc-complete-section`, `.doc-apply-success`, `.doc-apply-error`, `.doc-apply-btn`) —
  these were referenced in the JSX but had no styles yet.

## 2. Completed pages that were placeholders

- **Settings** — voice-reply toggle, notification toggle (both persisted locally), language
  shortcut, session ID display, export-profile-as-JSON, reset session.
- **Feedback** — star rating + category + message, posts to a new `app/api/feedback/route.js`
  that writes to a Supabase `app_feedback` table if you create one (SQL in the route's comment),
  and degrades to a server log if not — never a dead end for the citizen submitting it.
- **Languages** — a real selectable grid of all 22 languages already defined in
  `context/LanguageContext.js`, wired to the same `setLanguage()` your chat widget already reads.
- **AI Assistant** — a capability overview (6 cards, one per assistant function) with links to
  where each one runs live, instead of "coming soon."

## 3. Small pre-existing bugs fixed

- `jspdf` was imported in `app/application-support/page.js` (pre-filled application PDF) but
  never installed — `npm run build` failed on it. Added it to `package.json`.
- The floating `ChatWidget` component existed fully wired but was never mounted anywhere. It's
  now shown in `AppShell` on every page **except** the Dashboard (which already has its own
  full chat card), so help is reachable from Documents, Settings, etc. too.
- `app/documents/page.js` wasn't passing `schemeName` to `DocumentUpload`, so submitted
  applications had a blank scheme name — fixed.
- The floating `ChatWidget` was briefly mounted on every non-Dashboard page in an earlier pass,
  but that gave two separate chat surfaces (it and the Dashboard's inline chat aren't the same
  conversation/history). Removed per feedback — Dashboard remains the single chat entry point,
  and `ChatWidget.js` is back to being unused/available if you want it later.

## 4. Cross-document identity mismatch warning (Application Support page)

Found via testing: the Application Support page listed every OCR-"verified" document with a
green check, even when the names on them clearly belonged to different people (e.g. Aadhaar says
one name, the income certificate says another, the bank passbook a third) — because per-document
OCR verification only checks "is this the right *type* of document," not "does it belong to the
same person as your other documents."

- **`lib/docIdentity.js` (new)** — shared, dependency-free logic that pulls the name back out of
  each verified document's stored OCR text and compares it against the citizen's profile name (or,
  if no profile name is saved, against whichever name appears most often across the documents).
  Runs instantly on page load, no AI call needed. Death certificates and passport photos are
  correctly excluded (a death certificate is *supposed* to name someone else — the deceased).
- **`app/application-support/page.js`** — now shows a red warning banner listing exactly which
  document(s) don't match, tags the conflicting rows inline, requires an explicit "these are mine"
  confirmation checkbox before the PDF button unlocks, and stamps a warning note into the
  generated PDF itself if it's downloaded anyway.
- `components/DocumentUpload.js` now imports its field-mapping config from `lib/docIdentity.js`
  instead of a duplicate local copy, so both checks (live upload cross-check, and this historical
  summary cross-check) stay in sync if you ever change which fields are compared.

Tested against the exact mismatched-document scenario from a live run (Aadhaar: one name, income
certificate + bank passbook: two other names) — correctly flags both wrong documents and leaves
the death certificate alone.

## 5. "Digital Seva" identity rolled out app-wide

The stamp/marigold/Fraunces redesign was originally built for the Dashboard only. Extended it to
every page and the sidebar:

- **`app/globals.css`** — the root color variables (`--purple`, `--pink`, `--orange`, `--green`,
  `--red`, `--blue`, `--gradient-brand`, `--gradient-btn`) now hold the new ink/marigold/tulsi/
  seal-red palette instead of the old purple/pink. Every button, badge, card, and pill across the
  whole app already reads these variables by name, so this one change re-skins the entire product,
  sidebar included — no per-page rewrites needed. All ~46 places that had the old colors
  hardcoded as literal `rgba(...)` (translucent badge backgrounds, etc.) were remapped too, so
  nothing is left mismatched between old and new hues.
- **`app/layout.js`** — now loads Fraunces + IBM Plex Mono once, site-wide (previously only
  loaded on the Dashboard route).
- **`components/SakhiStamp.js` (new)** — the ink-stamp seal motif, pulled out of `app/page.js`
  into its own component so it could also become the **sidebar logo**, replacing the fox emoji.
- Verified with real browser screenshots + computed-style checks (background, gradient, font)
  on Dashboard, Eligibility, Scheme Discovery, and Settings — confirmed the new palette and
  typography are live everywhere, not just the Dashboard.

## 6. Login / Signup — Supabase Auth, not a custom password table

The whole app now sits behind a real login. Built on **Supabase Auth** (not a hand-rolled
`password` column) — Supabase hashes and stores credentials on their end; the app never touches
a raw password beyond passing it to `supabase.auth.signUp()` / `signInWithPassword()` over HTTPS.

- **`app/login/page.js`, `app/signup/page.js` (new)** — email + password screens styled with the
  same stamp/ink identity as the rest of the app. Signup handles both cases automatically:
  if your Supabase project has email confirmation ON (the default), it shows "check your email";
  if OFF, it logs the citizen straight in.
- **`lib/supabaseClient.js` (new)** — a browser-safe Supabase client using the public anon key
  (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, already in your `.env`). Separate from `lib/supabase.js`,
  which holds the server-only service role key and must never reach the browser.
- **`context/SessionContext.js` (rewritten)** — `sessionId` is now the logged-in citizen's
  Supabase Auth user ID instead of a random localStorage UUID. This is the key design choice:
  every existing page already reads `const { sessionId } = useSession()` and uses it as an opaque
  key into `citizen_profiles`, `citizen_documents`, etc. — so switching what generates that ID
  required **zero changes to any other page**. A citizen's data now follows their account across
  devices instead of being stuck to one browser.
- **`components/AppShell.js`** — now the auth gate. `/login` and `/signup` render full-screen
  with no sidebar; every other route redirects to `/login` if nobody's signed in.
- **Sidebar** — shows the logged-in email and a working "Log out" button.
  **Settings** — "Reset session" (which cleared a localStorage key that no longer exists) was
  replaced with a real "Log out" tied to Supabase Auth.

**Before your demo, check one setting in Supabase:** Dashboard → Authentication → Sign In / Providers
→ Email → **"Confirm email"**. If it's ON, every signup needs an email click before first login —
fine for production, bad for a live demo. Turn it OFF for the hackathon (turn it back on after if
you keep building this) so `Create Account` logs someone straight into the app in one step, live
on stage.

## Not touched

The Dashboard chat (`app/page.js`), eligibility engine, scheme data, Bhashini translation flow,
and existing visual theme are untouched — they were already working and weren't part of the ask.

## One thing to check on your end

`.env.local` is included as you uploaded it, but the `GEMINI_API_KEY` in it returns `403
Forbidden` from Google right now (tested during this build) — likely expired/restricted. Once
you drop in a working key, both the chat and the new document-verification calls will return
real Gemini output instead of falling back to static text.

## 4. RAG layer added (V2-style retrieval, layered onto V3)

Adds semantic search over a scheme corpus for general free-text questions, separate from and
never overriding the deterministic eligibility engine.

- **`db/rag_schema.sql` (new)** — Supabase pgvector setup: `scheme_documents` table +
  `match_scheme_documents` similarity-search RPC.
- **`lib/embeddings.js` (new)** — Gemini `text-embedding-004` wrapper, reusing the existing
  `GEMINI_API_KEY` (no new dependency, no new API key).
- **`lib/ragSearch.js` (new)** — vector search via Supabase when configured; falls back to
  keyword search over `data/corpus/seed-corpus.json` otherwise, matching `lib/supabase.js`'s
  existing degrade-don't-crash pattern.
- **`scripts/ingest-schemes.js` (new)** — CLI to embed and upsert a corpus JSON file. Adapts
  common public-dataset field names automatically.
- **`data/corpus/seed-corpus.json` (new)** — 30 documents auto-derived from the existing
  `SCHEMES` array, so the pipeline is demoable without any external dataset.
- **`agents/tools.js` / `tool-executor.js` / `system-prompt.js`** — new `search_schemes` tool,
  with an explicit rule that it's retrieval only and can never be used to declare eligibility.
- **`app/api/schemes/search/route.js` (new)** — standalone endpoint for testing/reuse outside
  the chat flow.
- Fixed `.GITIGNORE` -> `.gitignore` (the uppercase filename meant git silently ignored nothing
  on case-sensitive filesystems — `node_modules/` and `.env.local` would have been committed).
- `.env.example` filled in with every env var the app actually reads (previously only listed
  the Supabase ones).
- Added top-level `README.md` and `RAG.md` for submission/viva.

See `RAG.md` for full setup and design rationale (why pgvector over a separate vector DB, why
Gemini embeddings, how to scale from the 30-scheme seed corpus to the full myScheme dataset).

## 5. V1 and V2 built as real, runnable architectures + comparative evaluation harness

Previously this repo only had V3 (multi-agent). The BTP's core claim is a *comparison* of three
architectures, so V1 and V2 needed to exist as actual code, not just a description in the README.

- **`agents/plannerV1.js` (new)** — single-shot baseline: one Gemini call, no tools, no
  retrieval, no eligibility engine. Answers purely from the model's own training knowledge —
  deliberately the "naive" baseline the other two are compared against.
- **`agents/plannerV2.js` (new)** — RAG baseline: retrieves top-5 scheme excerpts via the same
  `lib/ragSearch.js` V3 uses, stuffs them into a single prompt, one LLM call. No tool loop, no
  deterministic eligibility engine — the LLM reads retrieved text and decides directly, which is
  exactly the failure mode being measured against V3's separated decision logic.
- **`app/api/chat/route.js`** — now accepts an optional `mode: "v1"|"v2"|"v3"` in the request
  body (defaults to `"v3"`, so the existing citizen-facing UI is unaffected) to dispatch to any
  of the three.
- **`eval/personas.js` (new)** — 4 fixed citizen personas across different states/occupations/
  categories, with a shared `personaToSentence()` so V1, V2, and V3 all receive an *identical*
  prompt for a given test case — isolating architecture as the only variable.
- **`scripts/evaluate.js` (new)** — the actual comparative-evaluation harness: for each persona,
  picks known-eligible and known-ineligible schemes from `lib/eligibility.js`'s ground truth,
  asks the same eligibility question to all three architectures, classifies each answer, and
  scores against ground truth. Outputs `eval/results/summary.md` (accuracy + confusion matrix)
  and a raw JSON log. Includes a one-question Hindi pilot for a first, qualitative read on
  regional-language robustness. **Has an explicit honesty note at the top about what this
  pilot-scale run does and doesn't prove** — see that file before citing numbers in the report.
- Fixed a stale test assertion in `lib/eligibility.test.js` that hardcoded `SCHEMES.length` to 8
  from when the dataset was much smaller (it's 30 now) — the test suite was actually failing
  before this fix.

This is still a pilot, not a finished evaluation — see the honesty notes in `scripts/evaluate.js`
and the README's "Running the evaluation" section for exactly what's still needed (more personas,
human-verified answer classification, a verified multi-language question set) before the numbers
are report-ready.

## 6. RAG fixes found while running real ingestion, + Scheme Discovery now browses the full corpus

Three real issues surfaced running `scripts/ingest-schemes.js` against a live Supabase project
and a 3,000+ row corpus, plus one product gap noticed once ingestion actually succeeded.

- **`text-embedding-004` is retired.** Google's API now returns 404 for it. Switched to
  `gemini-embedding-001` (`lib/embeddings.js`), which defaults to 3072-dim output instead of 768
  — updated `db/rag_schema.sql`'s `vector(768)` -> `vector(3072)` in both the table and the
  `match_scheme_documents` function signature to match.
- **The `scheme_documents_scheme_id_key` unique index had a partial `WHERE scheme_id is not
  null` clause**, which Postgres can't use as an `ON CONFLICT` target — every upsert in
  `scripts/ingest-schemes.js` was failing with "no unique or exclusion constraint matching the
  ON CONFLICT specification". Dropped the `WHERE` clause; a plain unique index already treats
  every `NULL` as distinct, so this doesn't change behavior for rows without a `scheme_id`.
- **Scheme Discovery only ever showed the local ~30 schemes.** The main grid reads from
  `data/schemes.js`, not `scheme_documents` — so after ingesting 3,000+ real schemes, none of
  them were visible except by typing a matching search query. Added:
  - `listSchemeDocuments()` in `lib/ragSearch.js` — plain paginated Supabase query (no
    embedding call), for browsing rather than searching.
  - `app/api/schemes/browse/route.js` — paginated endpoint over the full ingested corpus.
  - A new "Full scheme database" section in `app/scheme-discovery/page.js`, shown whenever
    there's no active search query, with Previous/Next pagination — this is what actually makes
    a large ingested corpus visible in the UI.

## 7. Real ~3,400-scheme myScheme corpus bundled directly in the repo

Previously `data/corpus/` only had the 30-scheme auto-generated demo. Prachi supplied the actual
scraped myScheme.gov.in dataset (`data/corpus/myscheme-schemes.json`, 3,400 records with
scheme_name/details/benefits/eligibility/application/documents/level/schemeCategory/tags fields),
which is now the default ingestion target.

- `scripts/ingest-schemes.js`'s `normalizeRecord()` updated for this dataset's exact field names
  (`slug` as the id, `details`/`eligibility`/`application` instead of the generic
  description/eligibility_criteria/application_process names it previously only recognized).
- `level` in this dataset is "Central"/"State" (government tier), not a state name — for State-tier
  schemes, `guessStateFromText()` does a substring match against a list of Indian states/UTs over
  the scheme's own detail text as a best-effort state tag (used only for the RAG search/browse
  state filter — never for eligibility decisions, which stay with `lib/eligibility.js`).
- A handful of exact-duplicate `slug` values in the source data are de-duplicated (first
  occurrence kept) before embedding, so ingestion doesn't burn API quota re-embedding identical
  text or hit a Postgres ON CONFLICT same-row-twice error.
- README.md / RAG.md updated to describe this as the bundled default corpus, not something you
  have to go find yourself. Since your BTP dataset appendix should document what you actually
  evaluated against, the raw file is kept in the repo rather than gitignored.

## 8. AI-estimated eligibility for the 3,000+ RAG-only schemes (Scheme Discovery)

Extends eligibility checking beyond the local 30, without pretending it's the same kind of
answer as the deterministic engine.

- **`lib/estimateEligibility.js` (new)** — one LLM call per request: citizen profile + a
  scheme's retrieved text in, `{ verdict, confidence, reasoning, requiredDocuments }` out. Every
  result carries `estimated: true` and every caller is required to present it as an estimate,
  never as a determination.
- **`app/api/schemes/estimate-eligibility/route.js` (new)** — loads the citizen's already-saved
  profile server-side (same one the Eligibility page and chat agent already share), runs the
  estimate. Takes the scheme's title/content directly from the client rather than re-fetching by
  id, since vector-search, keyword-fallback, and browse results don't share one consistent id
  shape — this sidesteps that rather than adding a fragile lookup across three shapes.
- **Scheme Discovery UI** — a "Check eligibility (AI estimate)" button on every RAG-only card
  (both the browse section and the search-results section), expanding inline to show the
  verdict, confidence %, one-line reasoning, and documents the scheme's own text mentions
  needing — visually distinct (amber/red/green verdict color, explicit "AI-estimated — not a
  verified determination" footer) from the local 30's "✓ Verified" badge.
- **Fixed a latent bug found while wiring this up**: `/api/schemes/search` was returning raw
  snake_case fields (`scheme_id`, `content`) while the page read camelCase (`schemeId`,
  `excerpt`) — meaning the "already shown above" dedup filter silently never matched anything,
  and "Official source" links never rendered. Now mapped consistently in the route.

Honesty note for the report/viva: this is deliberately a *different* metric from the
deterministic Claim Readiness Score, not a drop-in replacement computed the same way — there's
no tracked "verified documents" concept for schemes outside the local 30 (document verification
in this app is scheme-specific, tied to `data/schemes.js`'s hand-curated document checklists),
so a real apples-to-apples readiness score isn't honestly computable for the RAG corpus without
that data model changing. What's here is exactly what it says it is: an LLM's best guess, shown
as one.

## 9. RAG corpus wired into the core flows, not just Scheme Discovery

Audited every place the app read from the local 30-scheme array and extended what could be
honestly extended to the full 3,000+ RAG corpus. See the reasoning note at the end of this
entry for the two pages deliberately left as-is.

- **`hooks/useSchemeEstimate.js` + `components/EstimateBlock.js` (new)** — the estimate
  state/fetch logic and its UI, extracted out of `app/scheme-discovery/page.js` into shared
  modules so the same "AI-estimated eligibility" flow is available anywhere in the app without
  duplicating it.
- **`app/eligibility/page.js`** — the actual Check Eligibility flow (not just Scheme Discovery)
  now also searches the full corpus using the submitted profile as a query, showing a "More
  matches from the full scheme database" section under the verified results, each with an
  on-demand AI estimate. The two result lists are kept visibly separate — never merged — since
  one is deterministic and one is model-interpreted.
- **`app/page.js` (Dashboard)** — the "30+ Schemes" stat now fetches the real ingested total via
  `/api/schemes/browse` and displays that, falling back to 30 only if the fetch fails.
- **`app/saved-schemes/page.js` + `app/api/saved-schemes/route.js` + `db/saved_schemes_rag_migration.sql`
  (new)** — saving a RAG-corpus scheme from Scheme Discovery previously vanished from the Saved
  Schemes page (it only ever looked schemes up in the local 30). Added `title`/`source_url`
  columns so RAG-saved entries carry their own display data; the page now renders two sections
  instead of silently dropping one of them.
- **Two bugs fixed while auditing**: `/api/schemes/search` was returning snake_case fields while
  the page read camelCase (dedup filtering and "Official source" links were silently broken);
  and `app/api/saved-schemes/route.js` / `app/api/applications/route.js` both created an
  unguarded Supabase client directly instead of using `lib/supabase.js`'s resilient one — the
  same pattern that caused the very first build failure in this project. Both now use the
  shared client and return a graceful response instead of crashing when Supabase isn't
  configured.

**Deliberately left scoped to the local 30**: `app/application-support/page.js` and
`app/documents/page.js`. Both need structured, per-scheme data — a step-by-step application
checklist and a specific document list with verification state — that genuinely doesn't exist
for the RAG corpus (free text only). `lib/estimateEligibility.js` can extract a *plausible*
document list from a scheme's text (see `requiredDocuments` in its output), but there's no
tracked "verified" state for those documents the way there is for the 30, so building a fake
version of these two pages for RAG schemes would look complete without being accurate. If this
is worth doing for the final submission, the honest path is extending the document-verification
data model itself (tracking verified documents by type name rather than by scheme-specific id),
not faking these two pages on top of what exists now.
