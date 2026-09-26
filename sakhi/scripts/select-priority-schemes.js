// scripts/select-priority-schemes.js
//
// Selects candidate schemes for growing the verified list (data/schemes.js)
// beyond the current ~30, per the plan: prioritize commonly-searched,
// high-impact schemes rather than trying to hand-author all ~3,400.
//
// This project has no real usage/search-frequency analytics yet, so "high
// impact" is approximated with an honest, explainable, reproducible proxy
// instead of a guess:
//   1. Central-level only (level === "Central") — a state-run scheme only
//      helps residents of that one state, so central schemes have the
//      largest possible reach per scheme authored.
//   2. Name matches a "flagship" keyword (Pradhan Mantri, PM-, Ayushman,
//      National, Awas Yojana, etc.) — a rough but real signal that this is
//      a well-known central scheme rather than an obscure sub-component.
//   3. Has substantial eligibility + benefits text in the scraped corpus —
//      a scheme with a thin/empty description can't be turned into rules
//      you'd trust anyway, verified or not.
//   4. Not already in data/verifiedSchemeIds.js.
//
// This does NOT invent or verify any eligibility facts — it only ranks and
// selects from your own already-ingested corpus (data/corpus/myscheme-schemes.json).
// It's safe to run standalone, no API key or network needed.
//
// Usage:
//   node scripts/select-priority-schemes.js [count]
//
// Output: data/corpus/priority-schemes.json — feed this into
// scripts/draft-eligibility-rules.js as the batch to draft next.

import { readFileSync, writeFileSync } from "fs";
import { VERIFIED_SCHEME_IDS } from "../data/verifiedSchemeIds.js";

const CORPUS_PATH = "data/corpus/myscheme-schemes.json";
const OUTPUT_PATH = "data/corpus/priority-schemes.json";
const DEFAULT_COUNT = 150;

// Keywords that mark a scheme as a well-known central "flagship" — this list
// is intentionally named-scheme-recognizable rather than exhaustive; add to
// it if you know of other major schemes worth prioritizing.
const FLAGSHIP_KEYWORDS = [
  "pradhan mantri", "pm-", "pm ", "ayushman", "national ", "awas yojana",
  "kisan", "beti", "ujjwala", "mudra", "atal ", "stand-up", "skill",
  "scholarship", "vandana", "suraksha", "bima", "pension", "e-shram",
  "swachh", "digital india", "jan dhan", "jan arogya", "poshan",
  "employment guarantee", "credit card", "startup india", "vishwakarma",
  "svanidhi", "ujala", "saubhagya", "matru", "shram yogi",
];

function flagshipScore(name) {
  const lower = name.toLowerCase();
  return FLAGSHIP_KEYWORDS.filter((kw) => lower.includes(kw)).length;
}

function textLength(scheme) {
  return [scheme.eligibility, scheme.benefits, scheme.details]
    .filter(Boolean)
    .reduce((sum, s) => sum + s.length, 0);
}

function main() {
  const count = Number(process.argv[2]) || DEFAULT_COUNT;
  const corpus = JSON.parse(readFileSync(CORPUS_PATH, "utf-8"));
  const verifiedSet = new Set(VERIFIED_SCHEME_IDS);

  const candidates = corpus
    .filter((s) => s.level === "Central")
    .filter((s) => !verifiedSet.has(s.slug))
    .filter((s) => s.eligibility && s.eligibility.trim().length > 40) // needs enough text to draft rules from at all
    .map((s) => ({
      slug: s.slug,
      name: s.scheme_name,
      category: s.schemeCategory || null,
      flagshipScore: flagshipScore(s.scheme_name),
      textLength: textLength(s),
      eligibility: s.eligibility,
      benefits: s.benefits || null,
      documents: s.documents || null,
    }))
    .filter((s) => s.flagshipScore > 0) // only "recognizable" schemes — see module comment
    .sort((a, b) => b.flagshipScore - a.flagshipScore || b.textLength - a.textLength)
    .slice(0, count);

  writeFileSync(OUTPUT_PATH, JSON.stringify(candidates, null, 2));

  console.log(`Selected ${candidates.length} candidate schemes -> ${OUTPUT_PATH}`);
  console.log(`(from ${corpus.length} total, ${corpus.filter((s) => s.level === "Central").length} central-level, ${verifiedSet.size} already verified)`);
  console.log("\nTop 10:");
  candidates.slice(0, 10).forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (${c.slug}) — flagship score ${c.flagshipScore}`));
}

main();
