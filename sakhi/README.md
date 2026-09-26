# Yojana Sakhi — An Intelligent AI Framework for Government Welfare Scheme Discovery, Eligibility Assessment, and Citizen Assistance

BTP project: a comparative evaluation of three LLM system architectures — **single-shot
prompting**, **retrieval-augmented generation (RAG)**, and **multi-agent tool-calling** — applied
to the same real-world task: helping Indian citizens discover government welfare schemes they're
eligible for, understand what documents they need, and get help applying, in their own language.

This repository contains **V3**, the full multi-agent system (the other two versions are lighter
configurations of the same codebase, used for the comparative evaluation — see "Architecture
comparison" below).

## Why this problem

Government welfare schemes in India are fragmented across hundreds of central and state
department websites, each with its own eligibility language, document requirements, and
application process. Citizens — especially in regional languages, and especially those less
comfortable navigating government bureaucracy — routinely miss out on benefits they qualify for
simply because discovery and eligibility-checking are hard. myScheme.gov.in exists to address
discovery; this project's contribution is on **eligibility correctness, document readiness, and
multilingual reliability**, evaluated across architectures.

## Architecture comparison (the BTP's core research contribution)

All three architectures live in this one repo and share the same Gemini model, the same scheme
data, and — critically — receive the **exact same question text** for a given test case (see
`eval/personas.js`), so the comparison isolates architecture, not prompt wording.

| | V1 — Single-shot (`agents/plannerV1.js`) | V2 — RAG (`agents/plannerV2.js`) | V3 — Multi-agent (`agents/planner.js`, this app's default) |
|---|---|---|---|
| How it answers | One LLM call, no tools, no retrieval — purely the model's own training knowledge | One LLM call, grounded by top-5 semantically retrieved scheme excerpts (`lib/ragSearch.js`) stuffed into the prompt | LLM plans tool calls in a loop; a **deterministic rule engine** (not the LLM) makes the actual eligibility decision |
| Eligibility source of truth | Model's memory (unverifiable, hallucination-prone by design — this is the baseline) | Retrieved text, still interpreted by the model | `lib/eligibility.js` — hardcoded, unit-tested rules; the LLM only explains the result |
| Scheme coverage | Whatever the model "knows" | The bundled ~3,400-scheme myScheme corpus (`data/corpus/myscheme-schemes.json`) | ~30 hand-curated schemes for eligibility (`data/schemes.js`) + the same ~3,400-scheme RAG corpus for general Q&A |
| Extras | — | — | Bhashini multilingual (22 languages), OCR document verification, Claim Readiness Score |
| Run it | `mode: "v1"` in a POST to `/api/chat`, or via `scripts/evaluate.js` | `mode: "v2"` | Default (`mode: "v3"` or omitted) — this is what the citizen-facing UI always uses |

**Research questions:** (1) how does eligibility-decision reliability differ across the three
architectures when the rules are non-trivial (multiple conditions, edge cases)? (2) how does
answer quality degrade across regional languages in each architecture? (3) is a numeric Claim
Readiness Score a reliable, reproducible signal for "how close is this citizen to a successful
application"?

**`scripts/evaluate.js` answers question (1) directly** (and gives a first, pilot-scale read on
question (2)) — see "Running the evaluation" below. It is the actual comparative-evaluation
harness: fixed personas, identical prompts across all three architectures, scored against ground
truth from the same deterministic engine V3 uses internally.

## What's implemented in this repo (V3)

- **Multi-agent planner** (`agents/planner.js`) — Gemini 2.5 Flash with function-calling over a
  fixed tool set (`agents/tools.js`), executed by `agents/tool-executor.js`.
- **Deterministic eligibility engine** (`lib/eligibility.js` + `data/schemes.js`) — eligibility is
  never decided by the LLM; it's computed from structured rules the LLM can only report on. This
  is the load-bearing design choice for research question (1).
- **RAG layer** (`lib/ragSearch.js`, `lib/embeddings.js`, `db/rag_schema.sql`,
  `scripts/ingest-schemes.js`) — semantic search over a much larger scheme corpus than the
  eligibility engine's ~30 schemes, for general free-text questions ("is there a scheme for X").
  See `RAG.md` for the full setup and design notes.
- **Multilingual pipeline** (`lib/Bhashini.js`, `context/LanguageContext.js`) — Gemini always
  answers in English server-side; Bhashini ULCA translates client-side to the citizen's chosen
  language, so the eligibility/RAG logic only has to be correct once.
- **OCR + document verification** (`app/api/ocr/route.js`, `server/assistantService.js`) —
  extracts fields from uploaded ID documents and cross-checks them against the citizen's saved
  profile, flagging mismatches.
- **Claim Readiness Score** (`computeClaimReadiness` in `lib/eligibility.js`) — a 0–100 score
  combining eligibility match strength and verified-document completeness.
- **Persistent citizen profiles** via Supabase, with graceful in-memory fallback when Supabase
  isn't configured (so local dev/demo works without any setup).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values — see comments in that file for where each comes from
npm run dev
```

For the RAG layer specifically (pgvector setup, corpus ingestion), see **`RAG.md`**.

For a demo that doesn't depend on live API quota/network on presentation day, see
`scripts/generate-cache.js` and `CHANGES.md`.

## Running the evaluation

```bash
node scripts/evaluate.js --quick   # 1 persona, 2 questions per architecture — smoke test, ~1 min
node scripts/evaluate.js           # full pilot run — 4 personas, ~4 questions each, + a Hindi
                                    # language-robustness pilot question — a few minutes, ~50 LLM calls
```

Outputs `eval/results/summary.md` (accuracy + confusion matrix per architecture, ready to paste
into your report) and a timestamped raw JSON with every question/answer/classification for manual
spot-checking. **Read the "HONESTY NOTE" comment at the top of `scripts/evaluate.js` before citing
these numbers anywhere formal** — the current setup is a working pilot (4 personas, keyword-based
answer classification, one unverified-translation language sample), not yet a statistically
powered evaluation. Expanding `eval/personas.js` to 15-20 diverse personas and having a human
spot-check/re-label a sample of the classifications is what turns this from "the harness works"
into "here are our results."

## Project structure

```
agents/       Planners for all three architectures (planner.js = V3, plannerV1.js, plannerV2.js),
              tool definitions, system prompt
eval/         Comparative-evaluation harness: personas.js (test personas), results/ (output)
lib/          Eligibility engine, Supabase clients, RAG search, embeddings, Bhashini
data/         Hand-curated scheme rules (schemes.js) + RAG corpus (corpus/ — bundled ~3,400-scheme
              myscheme-schemes.json, plus a tiny 30-scheme seed-corpus.json demo/fallback)
db/           SQL to run once in Supabase (pgvector + RAG schema)
scripts/      Standalone CLI scripts (evaluate.js, RAG ingestion, demo cache generation)
server/       Assistant service functions (OCR verification, gap explanations, etc.)
app/          Next.js App Router pages + API routes
context/      React context (session/auth, language)
components/   Shared UI components
```

`CHANGES.md` has a detailed, dated log of what was built/fixed and why, for anyone (including
future you, during the viva) reconstructing the project's history.
