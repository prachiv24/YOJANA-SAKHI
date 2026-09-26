// scripts/generate-cache.js
//
// Pre-computes assistant responses for a fixed set of demo scenarios so your
// pitch doesn't depend on live network access or API latency. Run this once
// before demo day (and again any time schemes.js changes):
//
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/generate-cache.js
//
// Output: cache/assistant-cache.json
//
// Each entry is keyed by `${mode}:${stableStringify(payload)}` — the exact
// same key client/useAssistant.js computes before hitting the API. So a
// cache "hit" at demo time means the scheme + profile + docs you're showing
// are a byte-for-byte match to what was pre-generated here, not a guess.
//
// NOTE: this covers explain-gap, doc-checklist, next-steps, and
// ocr-fallback-question. It deliberately does NOT cache parse-fallback-answer
// or verify-document — those depend on live user typing / live OCR output,
// which can't be known ahead of time. Those two already have static
// fallbacks in useAssistant.js, which is the right behavior for them.

const fs = require("fs");
const path = require("path");

const {
  explainEligibilityGap,
  ocrFallbackQuestion,
  annotateDocumentChecklist,
  explainNextSteps,
} = require("../server/assistantService");

const CACHE_PATH = path.join(__dirname, "..", "cache", "assistant-cache.json");

// ---- stable cache key (MUST match client/useAssistant.js exactly) ----
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function cacheKey(mode, payload) {
  return `${mode}:${stableStringify(payload)}`;
}

// ---- minimal eligibility evaluator, matching the rule shape in schemes.js ----
// (comparators: eq, neq, lt, lte, gt, gte, exists, in — operators: AND, OR)
function ruleMatches(rule, profile) {
  const v = profile[rule.field];
  switch (rule.comparator) {
    case "eq": return v === rule.value;
    case "neq": return v !== rule.value;
    case "lt": return v < rule.value;
    case "lte": return v <= rule.value;
    case "gt": return v > rule.value;
    case "gte": return v >= rule.value;
    case "exists": return rule.value ? (v !== undefined && v !== null && v !== "") : (v === undefined || v === null || v === "");
    case "in": return Array.isArray(rule.value) && rule.value.includes(v);
    default: return true; // unknown comparator: don't block on it
  }
}

function getFailedRules(scheme, profile) {
  const { operator, rules } = scheme.eligibility;
  const evaluated = rules.map((rule) => ({ rule, passed: ruleMatches(rule, profile) }));
  if (operator === "OR") {
    // OR group passes if ANY rule passes. If none pass, treat all as gaps
    // (mirrors "here's everything that would need to change" framing).
    const anyPassed = evaluated.some((r) => r.passed);
    return anyPassed ? [] : evaluated.map((r) => r.rule);
  }
  // AND (default): every failing rule is a real, independent gap
  return evaluated.filter((r) => !r.passed).map((r) => r.rule);
}

// ---- sample demo profiles ----
// Two contrasting profiles so, between them, most schemes have *something*
// realistic to explain. If neither triggers a gap for a given scheme, that
// scheme just gets next-steps/doc-checklist cached (still useful) and no
// explain-gap entry — which is fine, live calls / static fallback cover it.
const SAMPLE_PROFILES = [
  {
    label: "young-urban",
    profile: {
      age: 22, gender: "male", state: "Maharashtra", residenceType: "urban",
      maritalStatus: "single", incomeAnnual: 450000, bplCard: false,
      disability: false, landOwned: true, socialCategory: "general",
      occupation: "salaried", aadhaarLinked: true,
    },
  },
  {
    label: "rural-senior-widow",
    profile: {
      age: 65, gender: "female", state: "Uttar Pradesh", residenceType: "rural",
      maritalStatus: "widow", incomeAnnual: 90000, bplCard: true,
      disability: false, landOwned: false, socialCategory: "SC",
      occupation: "none", aadhaarLinked: true,
    },
  },
];

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Export it before running this script.");
    process.exit(1);
  }

  // schemes.js uses `export const` (ESM); this script uses require (CJS) to
  // reuse assistantService.js as-is — dynamic import bridges the two.
  const { SCHEMES } = await import("../data/schemes.js");

  const cache = {};
  let calls = 0;
  let failures = 0;

  for (const scheme of SCHEMES) {
    // 1. next-steps — same output regardless of profile, one call covers it
    try {
      const payload = { scheme, lang: "en" };
      cache[cacheKey("next-steps", payload)] = await explainNextSteps(payload);
      calls++;
      console.log(`✓ next-steps          ${scheme.id}`);
    } catch (e) {
      failures++;
      console.warn(`✗ next-steps          ${scheme.id}: ${e.message}`);
    }

    // 2. doc-checklist — cache the common "first visit, has nothing yet" case
    try {
      const payload = { scheme, docsUserHas: [] };
      cache[cacheKey("doc-checklist", payload)] = await annotateDocumentChecklist(payload);
      calls++;
      console.log(`✓ doc-checklist       ${scheme.id}`);
    } catch (e) {
      failures++;
      console.warn(`✗ doc-checklist       ${scheme.id}: ${e.message}`);
    }

    // 3. explain-gap — for each sample profile, only if they actually fail something
    for (const { label, profile } of SAMPLE_PROFILES) {
      const failedRules = getFailedRules(scheme, profile);
      if (failedRules.length === 0) continue;
      try {
        const payload = { scheme, failedRules, profile, lang: "en" };
        cache[cacheKey("explain-gap", payload)] = await explainEligibilityGap(payload);
        calls++;
        console.log(`✓ explain-gap         ${scheme.id} (${label})`);
      } catch (e) {
        failures++;
        console.warn(`✗ explain-gap         ${scheme.id} (${label}): ${e.message}`);
      }
    }

    // 4. ocr-fallback-question — one representative document per scheme
    const firstDoc = scheme.requiredDocuments?.[0];
    if (firstDoc) {
      try {
        const payload = { documentName: firstDoc.name, expectedField: "annual income" };
        cache[cacheKey("ocr-fallback-question", payload)] = await ocrFallbackQuestion(payload);
        calls++;
        console.log(`✓ ocr-fallback-q      ${scheme.id}`);
      } catch (e) {
        failures++;
        console.warn(`✗ ocr-fallback-q      ${scheme.id}: ${e.message}`);
      }
    }
  }

  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

  console.log(`\nDone. ${calls} API calls made, ${failures} failed, ${Object.keys(cache).length} entries saved to`);
  console.log(CACHE_PATH);
}

main().catch((err) => {
  console.error("generate-cache.js failed:", err);
  process.exit(1);
});