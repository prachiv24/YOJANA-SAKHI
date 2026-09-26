// scripts/draft-eligibility-rules.js
//
// Semi-automated authoring, NOT auto-verification. For each candidate scheme
// in data/corpus/priority-schemes.json (see scripts/select-priority-schemes.js),
// asks Gemini to draft a structured eligibility rule tree in the exact shape
// lib/eligibility.js's deterministic engine expects — grounded in the
// scheme's own scraped eligibility text, not invented from the model's
// general knowledge.
//
// This is a DRAFTING step. Every output is tagged `verified: false,
// needsReview: true` and is never wired into the live rule engine
// automatically. A human must read each draft against the scheme's actual
// official guidelines, correct anything wrong, and only then move it into
// data/schemes.js (and add its id to data/verifiedSchemeIds.js) — same bar
// as the existing 30 hand-authored schemes. Skipping that review and
// shipping these as "Verified" would be worse than not having them at all:
// wrong eligibility info about a real welfare scheme can cost someone a
// benefit they were entitled to, or send someone down a dead-end application.
//
// Usage:
//   node scripts/draft-eligibility-rules.js [batchSize] [startIndex]
//
// Reads GEMINI_API_KEY from .env.local like scripts/ingest-schemes.js does.
// Resumable: re-running skips slugs already present in the output file, so
// you can draft in batches (rate limits, reviewing as you go, etc) instead
// of one huge run.

import { readFileSync, writeFileSync, existsSync } from "fs";

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const [, key, rawValue = ""] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvLocal();

const CANDIDATES_PATH = "data/corpus/priority-schemes.json";
const OUTPUT_PATH = "data/corpus/draft-eligibility-rules.json";
const DELAY_MS = 500; // stay comfortably under free-tier rate limits

// Must match the field vocabulary lib/eligibility.js and the citizen profile
// (context/SessionContext.js, lib/estimateEligibility.js) actually use — a
// drafted rule referencing a field the profile never collects is dead code.
const ALLOWED_FIELDS = [
  "age", "gender", "maritalStatus", "state", "incomeAnnual", "bplCard",
  "aadhaarLinked", "landOwned", "occupation", "socialCategory", "disability",
  "residenceType",
];
const ALLOWED_COMPARATORS = ["exists", "eq", "neq", "lt", "lte", "gt", "gte", "in"];

const DRAFT_SYSTEM_PROMPT = `You convert an Indian government welfare scheme's free-text eligibility
description into a structured rule tree for a deterministic eligibility engine.

Rules:
- Use ONLY these profile fields: ${ALLOWED_FIELDS.join(", ")}.
- Use ONLY these comparators: ${ALLOWED_COMPARATORS.join(", ")}.
- If the eligibility text depends on something NOT in the allowed fields (e.g. a specific
  certificate, a caste sub-category not covered by "socialCategory", a professional license),
  do NOT invent a field for it — instead add it as a note in "uncoveredConditions" so a human
  reviewer knows the rule tree is incomplete.
- If the eligibility text is too vague or incomplete to encode confidently, return an empty
  "rules" array and explain why in "uncoveredConditions" — do not guess a plausible-sounding
  rule not actually stated in the text.
- Every rule needs a short "gapMessage" in plain English explaining what's missing when that
  specific condition fails, matching the style of an official eligibility notice.

Respond with ONLY a JSON object (no markdown fences, no other text) in exactly this shape:
{
  "eligibility": { "operator": "AND", "rules": [ { "field": "...", "comparator": "...", "value": ..., "gapMessage": "..." } ] },
  "uncoveredConditions": ["<plain-English description of anything in the source text this rule tree does NOT capture>"],
  "confidence": <integer 0-100, your own estimate of how completely/correctly this rule tree reflects the source text>
}`;

async function draftOne(model, scheme) {
  const prompt = `SCHEME: ${scheme.name}\n\nELIGIBILITY TEXT (from official/aggregator source):\n${scheme.eligibility}\n\nBENEFITS (for context only): ${scheme.benefits || "(none provided)"}`;

  const response = (await model.generateContent(prompt)).response;
  const parsed = JSON.parse(response.text());

  return {
    id: scheme.slug,
    name: scheme.name,
    category: scheme.category,
    verified: false,
    needsReview: true,
    draftedBy: "gemini-3.8-flash",
    draftedAt: new Date().toISOString(),
    sourceEligibilityText: scheme.eligibility, // kept for side-by-side human review
    eligibility: parsed.eligibility ?? { operator: "AND", rules: [] },
    uncoveredConditions: Array.isArray(parsed.uncoveredConditions) ? parsed.uncoveredConditions : [],
    modelConfidence: Number.isFinite(parsed.confidence) ? parsed.confidence : null,
  };
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not set (check .env.local) — can't draft rules without it.");
    process.exit(1);
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.8-flash",
    systemInstruction: { role: "system", parts: [{ text: DRAFT_SYSTEM_PROMPT }] },
    generationConfig: { responseMimeType: "application/json" },
  });

  const candidates = JSON.parse(readFileSync(CANDIDATES_PATH, "utf-8"));
  const existing = existsSync(OUTPUT_PATH) ? JSON.parse(readFileSync(OUTPUT_PATH, "utf-8")) : [];
  const alreadyDrafted = new Set(existing.map((d) => d.id));

  const batchSize = Number(process.argv[2]) || 20;
  const startIndex = Number(process.argv[3]) || 0;

  const todo = candidates
    .slice(startIndex)
    .filter((c) => !alreadyDrafted.has(c.slug))
    .slice(0, batchSize);

  if (!todo.length) {
    console.log("Nothing to draft — all candidates in range are already drafted.");
    return;
  }

  console.log(`Drafting ${todo.length} schemes (${alreadyDrafted.size} already drafted, ${candidates.length} total candidates)...`);

  const drafted = [...existing];
  for (let i = 0; i < todo.length; i++) {
    const scheme = todo[i];
    try {
      const draft = await draftOne(model, scheme);
      drafted.push(draft);
      console.log(`  [${i + 1}/${todo.length}] ${scheme.name} — ${draft.eligibility.rules.length} rule(s), confidence ${draft.modelConfidence}`);
    } catch (err) {
      console.error(`  [${i + 1}/${todo.length}] ${scheme.name} — FAILED: ${err.message}`);
    }
    if (i < todo.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(drafted, null, 2));
  console.log(`\nWrote ${drafted.length} total drafts -> ${OUTPUT_PATH}`);
  console.log("Next: review each draft against the scheme's actual official guidelines before");
  console.log("moving it into data/schemes.js and adding its id to data/verifiedSchemeIds.js.");
}

main();
