# Yojana Sakhi (योजना सखी)

> **An intelligent AI framework for multilingual welfare-scheme discovery, automated eligibility verification, and citizen application assistance.**

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Model-Gemini%202.5%20Flash-blue?style=flat&logo=google)](https://deepmind.google/technologies/gemini/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20%2B%20pgvector-emerald?style=flat&logo=supabase)](https://supabase.com/)
[![Bhashini ULCA](https://img.shields.io/badge/Translation-Bhashini%20ULCA-orange)](https://bhashini.gov.in/)

---

## Executive Summary

Accessing government welfare schemes in India is hindered by fragmented departmental portals, complex legal eligibility criteria, and language barriers. While portals like `myScheme.gov.in` centralize scheme aggregation, **Yojana Sakhi** bridges the critical execution gap.

Yojana Sakhi is an end-to-end civic-tech framework that lets citizens discover eligible schemes through natural multilingual conversation, auto-verify their identity documents via computer-vision OCR, and receive an actionable **Claim Readiness Score** before submitting an application.

```
┌─────────────────────────────────────────────────────────┐
│  1. DISCOVERY PIPELINE                                   │
│  User natural-language query (voice / text)              │
│    → Vector embedding engine (Supabase / pgvector)        │
│    → RAG retrieval over 3,400+ scheme corpus               │
└──────────────────────────┬────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  2. REQUIREMENT RESOLVER                                  │
│  Checks scheme type:                                      │
│    ├─ Curated core schemes  → hardcoded rule engine        │
│    └─ Long-tail database    → dynamic Gemini AI fallback   │
└──────────────────────────┬────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  3. OCR & VERIFICATION PIPELINE                           │
│  Uploaded proof documents (Aadhaar, income proof, etc.)   │
│    → Vision OCR data extraction & field mapping            │
│    → Profile cross-check (mismatch red-flagging)           │
│    → Claim Readiness Score & guided submission              │
└─────────────────────────────────────────────────────────┘
```

---

## Core System Architecture & Features

### 1. Hybrid Eligibility & Verification Engine
To eliminate generative-AI hallucination in critical government eligibility checks, Yojana Sakhi uses a production-ready hybrid architecture:
- **Deterministic rule engine** (`lib/eligibility.js`) — high-frequency curated schemes are evaluated with strict, unit-tested programmatic logic for age, income, category, landholding, and state residency, giving 100% decision consistency.
- **Dynamic AI fallback layer** — long-tail schemes outside the curated set use **Gemini 2.5 Flash** to extract document requirements and eligibility rules on the fly from retrieved vector context chunks.

### 2. Multi-Agent Planning & Function Calling
The default production interface (**V3 Planner**) runs an autonomous loop in which the LLM plans and invokes specialized tools (`agents/tools.js`, executed via `agents/tool-executor.js`) — profile retrievers, rule checks, and document matchers. The LLM acts as an explanatory interface rather than an unguided decision-maker.

### 3. Computer Vision Document OCR & Verification
The OCR pipeline (`app/api/ocr/route.js`) extracts structured metadata (name, date of birth, ID numbers, income thresholds) from uploaded citizen documents (Aadhaar, ration cards, passbooks) and automatically flags mismatches against the citizen's saved profile, disabling submission until discrepancies are resolved.

### 4. Bhashini Multilingual Translation Pipeline
Server-side planning and rule evaluation run strictly in English to guarantee logic reliability. Client-side localization is handled dynamically by **Bhashini ULCA APIs**, enabling support across 22 scheduled Indian languages without compromising backend decision integrity.

### 5. Algorithmic Claim Readiness Score (0–100)
A real-time readiness metric combining eligibility match strength and verified document completeness, giving citizens an immediate signal of how close they are to a successful, error-free submission.

---

## Architectural Benchmarking System

An internal evaluation harness (`scripts/evaluate.js`) quantitatively benchmarks three LLM paradigm configurations against the same test personas:

| Metric / Feature | V1 — Single-Shot Prompting | V2 — Retrieval-Augmented Generation (RAG) | V3 — Multi-Agent Tool-Calling (Default) |
|---|---|---|---|
| **Execution architecture** | Direct LLM prompt, no external memory or tools (`agents/plannerV1.js`) | Prompt stuffed with top-5 vector embeddings (`agents/plannerV2.js`) | Autonomous tool invocation with deterministic engine verification (`agents/planner.js`) |
| **Eligibility authority** | Model parameter memory *(hallucination-prone)* | Retrieved text interpreted dynamically by the LLM | **Deterministic code engine** (`lib/eligibility.js`) |
| **Scheme knowledge base** | Unverified training parameters | ~3,400 myScheme corpus (`myscheme-schemes.json`) | Hand-curated rule DB (~30 core) + ~3,400 scheme RAG corpus |
| **Document verification** | None | Text-based document lists | **Active OCR extraction & profile cross-matching** |
| **Multilingual support** | Standard LLM output | Standard LLM output | **Bhashini ULCA translation pipeline (22 languages)** |

---

## Directory Structure

```
├── agents/               # Multi-agent planners (V3 production, V1/V2 baselines)
│   ├── planner.js        # V3 autonomous multi-agent loop
│   ├── tools.js           # Tool definitions for LLM function calling
│   └── tool-executor.js  # Real-time tool execution handler
├── app/                   # Next.js App Router (pages, UI components, API routes)
│   ├── api/ocr/           # Computer vision document processing pipeline
│   └── api/chat/          # Unified orchestration endpoint (V1/V2/V3 switching)
├── data/                  # Hand-curated scheme rules (schemes.js) & corpus vectors
├── db/                    # SQL migrations & pgvector setup scripts
├── lib/                   # Deterministic eligibility engine, embeddings, Bhashini wrappers
│   ├── eligibility.js     # Programmatic eligibility logic & scoring
│   ├── ragSearch.js       # Supabase pgvector semantic search engine
│   └── Bhashini.js        # Government of India Bhashini translation client
├── scripts/               # Ingestion pipelines, evaluation benchmarks, offline caching
└── eval/                  # Persona test suites and evaluation output storage
```

---

## Quickstart & Setup

### Prerequisites
- Node.js v18.x or higher
- A Supabase instance with the `pgvector` extension enabled
- A Google Gemini API key (Gemini 2.5 Flash)

### 1. Installation
```bash
git clone https://github.com/prachiv24/YOJANA-SAKHI.git
cd YOJANA-SAKHI
npm install
```

### 2. Environment Configuration
Create a local environment file from the template:
```bash
cp .env.example .env.local
```

Configure the variables inside `.env.local`:
```bash
# Gemini configuration
GEMINI_API_KEY=your_gemini_api_key

# Supabase vector database
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Bhashini ULCA API (optional for local dev)
BHASHINI_API_KEY=your_bhashini_key
BHASHINI_USER_ID=your_bhashini_user_id
```

### 3. Database & Vector Setup
Run the SQL schema in `db/rag_schema.sql` inside your Supabase SQL editor, then ingest the scheme corpus:
```bash
node scripts/ingest-schemes.js
```

### 4. Launch the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Running the Architecture Benchmark Suite

To compare performance across V1 (single-shot), V2 (RAG), and V3 (multi-agent):
```bash
# Fast smoke test (1 persona, quick verification)
node scripts/evaluate.js --quick

# Full architectural evaluation run
node scripts/evaluate.js
```
Results are written to `eval/results/summary.md`, including confusion matrices, classification accuracy, and latency comparisons across architectures.

---

## Offline / Demo Mode

To run a reliable demo without live external API quota constraints:
```bash
node scripts/generate-cache.js
```
The application automatically falls back to in-memory processing if network requests or database credentials are unavailable.

---

## License & Attribution

*(Add license details here — e.g. MIT, Apache 2.0 — and any third-party attributions for the myScheme corpus, Bhashini, and other data sources used.)*
