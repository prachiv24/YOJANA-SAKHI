// scripts/ingest-schemes.js
//
// Embeds a scheme corpus and upserts it into Supabase's scheme_documents
// table (see db/rag_schema.sql — run that SQL once first).
//
// Usage:
//   node scripts/ingest-schemes.js                                # ingests the bundled real
//                                                                  # ~3,400-scheme myScheme corpus
//   node scripts/ingest-schemes.js data/corpus/seed-corpus.json    # ingests the tiny 30-scheme
//                                                                  # demo corpus instead
//   node scripts/ingest-schemes.js data/corpus/your-file.json      # ingests any other corpus
//
// Expected input: a JSON array. Each item can either already be in this
// project's shape:
//   { scheme_id, title, state, category, source_url, content }
// or the shape used by the bundled myScheme scrape (data/corpus/myscheme-schemes.json):
//   { scheme_name, slug, details, benefits, eligibility, application, documents, level, schemeCategory }
// — this script auto-detects and adapts both, plus a few other common public-dataset field name
// variants. If your file uses different field names, adjust `normalizeRecord()`.
//
// Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
// GEMINI_API_KEY from .env.local (all already needed elsewhere in this
// project) — run this from the project root so that file is found.

import { readFileSync, existsSync } from "fs";

// Standalone scripts don't get Next.js's automatic .env.local loading, and
// this project doesn't otherwise depend on the `dotenv` package — so load
// it by hand rather than adding a new dependency for one script.
function loadEnvLocal() {
  if (!existsSync(".env.local")) return;

  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;

    const [, key, rawValue = ""] = match;
    if (process.env[key] !== undefined) continue; // real env always wins

    process.env[key] = rawValue.replace(/^["']|["']$/g, ""); // strip surrounding quotes, if any
  }
}

loadEnvLocal();

const { supabase } = await import("../lib/supabase.js");
const { embedTexts } = await import("../lib/embeddings.js");

const DEFAULT_CORPUS_PATH = "data/corpus/myscheme-schemes.json";
const BATCH_SIZE = 25;

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// For the bundled myScheme corpus, "level" is "Central" or "State" — which tier of
// government runs the scheme, NOT which state. The actual state (when it's a state
// scheme) is only mentioned in free text, so we do a light substring match against
// this list. Not exhaustive/perfect (a scheme's details might mention a different
// state in passing), but good enough for the search_schemes state filter to be
// directionally useful; it's advisory retrieval, not the eligibility engine.
const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Orissa", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar", "Chandigarh", "Dadra and Nagar Haveli", "Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry", "Pondicherry",
].sort((a, b) => b.length - a.length); // longest first so "Uttar Pradesh" wins over any shorter overlap

function guessStateFromText(text) {
  if (!text) return null;
  const found = INDIAN_STATES_AND_UTS.find((s) => text.includes(s));
  return found === "Orissa" ? "Odisha" : found === "Pondicherry" ? "Puducherry" : found ?? null;
}

/**
 * Adapts a few common public-dataset field name variants into this
 * project's { scheme_id, title, state, category, source_url, content }
 * shape. Extend this if your source file uses other field names.
 */
function normalizeRecord(raw, index) {
  const title =
    raw.title ?? raw.scheme_name ?? raw.schemeName ?? raw.name ?? `Untitled scheme ${index}`;

  // raw.level (bundled myScheme corpus) is "Central"/"State" — the government tier,
  // not a state name — so it's handled separately from raw.state (already-normalized
  // shape) rather than merged into the same fallback chain as before.
  let state = raw.state ?? (raw.central ? "central" : null) ?? null;
  if (!state && raw.level) {
    state = raw.level === "Central" ? "central" : guessStateFromText(raw.details ?? raw.description ?? "");
  }

  const category = raw.category ?? raw.schemeCategory ?? null;

  const sourceUrl =
    raw.source_url ?? raw.applicationUrl ?? raw.official_link ?? raw.officialLink ?? raw.url ?? null;

  const schemeId = raw.scheme_id ?? raw.id ?? raw.slug ?? slugify(title);

  // If the record already has a prebuilt `content` string (our own seed
  // corpus shape), use it as-is. Otherwise assemble one from whichever of
  // the common descriptive fields are present.
  const content =
    raw.content ??
    [
      `Scheme: ${title}`,
      state ? `State: ${state}` : null,
      category ? `Category: ${category}` : null,
      raw.description ? `Description: ${raw.description}` : null,
      raw.details ? `Description: ${raw.details}` : null,
      raw.eligibility_criteria ?? raw.eligibilityCriteria ?? raw.eligibility
        ? `Eligibility: ${raw.eligibility_criteria ?? raw.eligibilityCriteria ?? raw.eligibility}`
        : null,
      raw.benefits ? `Benefits: ${raw.benefits}` : null,
      raw.application_process ?? raw.applicationProcess ?? raw.application
        ? `Application process: ${raw.application_process ?? raw.applicationProcess ?? raw.application}`
        : null,
      raw.documents ? `Required documents: ${raw.documents}` : null,
    ]
      .filter(Boolean)
      .join("\n");

  return { scheme_id: schemeId, title, state, category, source_url: sourceUrl, content };
}

async function main() {
  if (!supabase) {
    console.error(
      "Supabase isn't configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY " +
        "missing from .env.local) — nothing to ingest into. Aborting."
    );
    process.exit(1);
  }

  const corpusPath = process.argv[2] ?? DEFAULT_CORPUS_PATH;
  console.log(`Reading corpus from ${corpusPath} ...`);

  const raw = JSON.parse(readFileSync(corpusPath, "utf-8"));
  const allRecords = (Array.isArray(raw) ? raw : raw.schemes ?? raw.data ?? []).map(normalizeRecord);

  // The bundled myScheme corpus has a handful of exact-duplicate rows (same
  // slug, same content) — keep the first occurrence of each scheme_id only,
  // so we don't burn embedding-API quota re-embedding identical text.
  const seen = new Set();
  const records = allRecords.filter((r) => {
    if (seen.has(r.scheme_id)) return false;
    seen.add(r.scheme_id);
    return true;
  });

  if (records.length < allRecords.length) {
    console.log(`Skipped ${allRecords.length - records.length} duplicate scheme_id(s).`);
  }

  if (!records.length) {
    console.error("No records found in corpus file — check the file's shape (expected a JSON array).");
    process.exit(1);
  }

  console.log(`Found ${records.length} documents. Embedding in batches of ${BATCH_SIZE}...`);

  let ingested = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const embeddings = await embedTexts(
      batch.map((r) => r.content),
      {
        taskType: "RETRIEVAL_DOCUMENT",
        onProgress: (done) =>
          process.stdout.write(`\r  batch ${i / BATCH_SIZE + 1}: embedded ${done}/${batch.length}`),
      }
    );

    process.stdout.write("\n");

    const rows = batch
      .map((r, j) => ({ ...r, embedding: embeddings[j] }))
      .filter((r) => r.embedding); // drop any that failed to embed (e.g. transient API error) rather than crash the whole run

    if (rows.length) {
      const { error } = await supabase.from("scheme_documents").upsert(rows, { onConflict: "scheme_id" });

      if (error) {
        console.error(`  batch ${i / BATCH_SIZE + 1} upsert failed:`, error.message);
      } else {
        ingested += rows.length;
      }
    }

    console.log(`Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length} processed, ${ingested} ingested so far`);
  }

  console.log(`\nDone. Ingested ${ingested}/${records.length} documents into scheme_documents.`);
  console.log('Run `analyze scheme_documents;` in the Supabase SQL editor if this was a large batch.');
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
