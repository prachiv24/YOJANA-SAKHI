// data/verifiedSchemeIds.js
//
// The list of scheme ids in data/schemes.js — i.e. the ones with hand-authored,
// deterministic eligibility rules (lib/eligibility.js), as opposed to the RAG-only
// corpus (data/corpus/myscheme-schemes.json) that only gets an LLM best-effort
// estimate (lib/estimateEligibility.js).
//
// This file exists so growth tooling (scripts/select-priority-schemes.js) has a
// single source of truth for "already verified, don't re-suggest" instead of
// re-parsing data/schemes.js. If you promote a drafted scheme (see
// scripts/draft-eligibility-rules.js) into data/schemes.js, add its id here too —
// nothing breaks if you forget, but the priority list may suggest it again.

export const VERIFIED_SCHEME_IDS = [
  "up-widow-pension",
  "pmay-g",
  "pmjdy",
  "ignoaps",
  "igndps",
  "pm-kisan",
  "pmuy",
  "ab-pmjay",
  "apy",
  "pmsby",
  "pmjjby",
  "pmfby",
  "pmmvy",
  "jsy",
  "pmay-u",
  "nfbs",
  "pm-sym",
  "pmvvy",
  "rashtriya-vayoshri",
  "pm-svanidhi",
  "stand-up-india",
  "pm-mudra",
  "pmkvy",
  "ddu-gky",
  "mgnrega",
  "pm-vishwakarma",
  "aay",
  "nsp-post-matric-sc",
  "nsp-pre-matric-st",
  "ssy",
];
