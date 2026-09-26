// scripts/evaluate.js
//
// The BTP's core comparative-evaluation harness. Runs a fixed set of
// (persona, scheme) eligibility questions through all three architectures —
// V1 (single-shot, no grounding), V2 (single-shot + RAG), V3 (multi-agent +
// deterministic eligibility engine) — using IDENTICAL prompts across all
// three (see eval/personas.js: personaToSentence()), and scores each
// architecture's answer against ground truth computed directly from
// lib/eligibility.js (the same deterministic logic V3 uses internally,
// which is why V3 is expected — and should be shown — to score highest).
//
// Usage:
//   node scripts/evaluate.js                # full run (all personas x all modes)
//   node scripts/evaluate.js --quick         # 1 persona, 2 questions, for a fast smoke test
//
// Output:
//   eval/results/results-<timestamp>.json    raw per-question records
//   eval/results/summary.md                  accuracy table + confusion matrix per mode
//
// Requires GEMINI_API_KEY in .env.local (same one the app already uses).
// Each question costs one LLM call per mode (V2 also costs one embedding
// call for retrieval) — the full run is ~4 personas x 4 questions x 3 modes
// = 48 LLM calls. Budget a few minutes and stay mindful of free-tier quota.
//
// ---------------------------------------------------------------------
// HONESTY NOTE FOR YOUR BTP WRITE-UP — read this before citing the numbers:
// ---------------------------------------------------------------------
// 1. Answer classification (classifyAnswer below) is a keyword heuristic,
//    not an LLM-graded or human-graded judgment. It's good enough to
//    validate the harness works and to get a directional first read, but a
//    handful of responses will likely be misclassified (e.g. hedged
//    answers). Spot-check the raw text in the JSON output before trusting
//    the accuracy numbers, and ideally have a human re-label a sample.
// 2. 4 personas is a pilot sample, not a statistically powered evaluation.
//    Expand eval/personas.js before treating this as a real result.
// 3. The "language robustness" section (Hindi question) is a qualitative
//    pilot only — one question, one language, machine-translated by an AI
//    assistant and NOT verified by a native speaker. Treat it as "does the
//    pipeline work at all with non-English input", not as a language-
//    accuracy measurement. Get the translation checked, add more languages
//    and more questions, before this becomes a claim in your report.
// ---------------------------------------------------------------------

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";

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

const { evaluateAllSchemes } = await import("../lib/eligibility.js");
const { SCHEMES } = await import("../data/schemes.js");
const { PERSONAS, personaToSentence } = await import("../eval/personas.js");
const { runPlannerTurn } = await import("../agents/planner.js");
const { runPlannerTurnV1 } = await import("../agents/plannerV1.js");
const { runPlannerTurnV2 } = await import("../agents/plannerV2.js");

const QUICK = process.argv.includes("--quick");
const DELAY_MS = Number(process.env.EVAL_DELAY_MS) || 1500;
const QUESTIONS_PER_PERSONA = QUICK ? 2 : 4; // split roughly evenly between eligible/ineligible

const MODES = {
  v1: runPlannerTurnV1,
  v2: runPlannerTurnV2,
  v3: runPlannerTurn,
};

const HINDI_PILOT_QUESTION = {
  personaId: "sunita",
  schemeKey: "up-widow-pension",
  expected: true,
  text:
    'मेरी उम्र 31 वर्ष है, मैं महिला हूँ, मैं विधवा हूँ, मैं उत्तर प्रदेश में रहती हूँ। मेरी वार्षिक पारिवारिक आय ₹80000 है। मेरे पास बीपीएल कार्ड है। मेरा आधार मेरे बैंक खाते से जुड़ा है। मेरे 2 आश्रित हैं। मेरे पास कोई ज़मीन नहीं है। मैं बेरोज़गार हूँ। मेरी सामाजिक श्रेणी ओबीसी है। मुझे कोई विकलांगता नहीं है। मैं ग्रामीण क्षेत्र में रहती हूँ। ' +
    'क्या मैं "विधवा पेंशन योजना" के लिए पात्र हूँ? पहले केवल एक शब्द में उत्तर दें — "हाँ" या "नहीं" — फिर एक वाक्य में स्पष्टीकरण दें।',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Builds each persona's fixed question set: half known-eligible, half known-ineligible,
 * chosen deterministically (sorted by schemeKey) so re-runs are reproducible. */
function buildQuestionsForPersona(persona) {
  const results = evaluateAllSchemes(persona.profile, SCHEMES);
  const eligible = results.filter((r) => r.eligible).sort((a, b) => a.schemeKey.localeCompare(b.schemeKey));
  const ineligible = results.filter((r) => !r.eligible).sort((a, b) => a.schemeKey.localeCompare(b.schemeKey));

  const half = Math.ceil(QUESTIONS_PER_PERSONA / 2);
  const picked = [...eligible.slice(0, half), ...ineligible.slice(0, QUESTIONS_PER_PERSONA - half)];

  return picked.map((r) => ({
    personaId: persona.id,
    schemeKey: r.schemeKey,
    schemeName: r.schemeName,
    expected: r.eligible,
  }));
}

/** Keyword-based classifier — see the HONESTY NOTE at the top of this file. */
function classifyAnswer(text) {
  const t = text.trim().toLowerCase();
  const firstWord = t.split(/[\s,.:;!]+/)[0];

  if (firstWord === "yes" || firstWord === "हाँ" || firstWord === "haan") return true;
  if (firstWord === "no" || firstWord === "नहीं" || firstWord === "nahi" || firstWord === "nahin") return false;

  const negPhrases = ["not eligible", "do not qualify", "don't qualify", "doesn't qualify", "not qualify", "are not eligible"];
  if (negPhrases.some((p) => t.includes(p))) return false;

  const posPhrases = ["you are eligible", "you qualify", "you're eligible", "yes, you"];
  if (posPhrases.some((p) => t.includes(p))) return true;

  return null; // unclear
}

async function runOne(mode, question, questionText) {
  const runTurn = MODES[mode];
  const sessionId = `eval-${mode}-${question.personaId}-${question.schemeKey}-${Date.now()}`;

  const start = Date.now();
  let finalText = "";
  let error = null;

  try {
    const result = await runTurn(sessionId, [], questionText);
    finalText = result.finalText;
  } catch (err) {
    error = err.message || String(err);
  }

  const latencyMs = Date.now() - start;
  const classification = error ? null : classifyAnswer(finalText);

  return {
    mode,
    ...question,
    latencyMs,
    error,
    responseText: finalText,
    classification, // true = model said eligible, false = model said not eligible, null = unclear
    correct: error ? false : classification === question.expected,
  };
}

function summarize(records) {
  const byMode = {};

  for (const mode of Object.keys(MODES)) {
    const rows = records.filter((r) => r.mode === mode);
    const total = rows.length;
    const errors = rows.filter((r) => r.error).length;
    const unclear = rows.filter((r) => !r.error && r.classification === null).length;
    const correct = rows.filter((r) => r.correct).length;

    const tp = rows.filter((r) => r.expected === true && r.classification === true).length;
    const fp = rows.filter((r) => r.expected === false && r.classification === true).length;
    const tn = rows.filter((r) => r.expected === false && r.classification === false).length;
    const fn = rows.filter((r) => r.expected === true && r.classification === false).length;

    const avgLatencyMs = total ? Math.round(rows.reduce((s, r) => s + r.latencyMs, 0) / total) : 0;

    byMode[mode] = {
      total,
      correct,
      accuracy: total ? +(correct / total).toFixed(3) : 0,
      unclear,
      unclearRate: total ? +(unclear / total).toFixed(3) : 0,
      errors,
      avgLatencyMs,
      confusion: { truePositive: tp, falsePositive: fp, trueNegative: tn, falseNegative: fn },
    };
  }

  return byMode;
}

function toMarkdown(byMode, records, hindiPilot) {
  const modeLabel = { v1: "V1 — single-shot", v2: "V2 — RAG single-shot", v3: "V3 — multi-agent" };

  let md = `# Evaluation summary\n\nGenerated ${new Date().toISOString()}\n\n`;
  md += `Pilot run: ${new Set(records.map((r) => r.personaId)).size} persona(s), ${records.length / 3} question(s) per architecture.\n`;
  md += `**See the HONESTY NOTE at the top of scripts/evaluate.js before citing these numbers in your report.**\n\n`;

  md += `| Architecture | Accuracy | Correct/Total | Unclear rate | Errors | Avg latency (ms) |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const mode of Object.keys(MODES)) {
    const s = byMode[mode];
    md += `| ${modeLabel[mode]} | ${(s.accuracy * 100).toFixed(1)}% | ${s.correct}/${s.total} | ${(s.unclearRate * 100).toFixed(1)}% | ${s.errors} | ${s.avgLatencyMs} |\n`;
  }

  md += `\n## Confusion matrix (positive class = "eligible")\n\n`;
  md += `| Architecture | True Positive | False Positive | True Negative | False Negative |\n`;
  md += `|---|---|---|---|---|\n`;
  for (const mode of Object.keys(MODES)) {
    const c = byMode[mode].confusion;
    md += `| ${modeLabel[mode]} | ${c.truePositive} | ${c.falsePositive} | ${c.trueNegative} | ${c.falseNegative} |\n`;
  }

  if (hindiPilot?.length) {
    md += `\n## Language robustness pilot (Hindi, one question, unverified translation — qualitative only)\n\n`;
    for (const r of hindiPilot) {
      md += `**${modeLabel[r.mode]}:** ${r.error ? `ERROR: ${r.error}` : r.responseText}\n\n`;
    }
  }

  md += `\n## Raw per-question results\n\n`;
  md += `| Architecture | Persona | Scheme | Expected | Model said | Correct | Latency (ms) |\n`;
  md += `|---|---|---|---|---|---|---|\n`;
  for (const r of records) {
    const said = r.error ? "ERROR" : r.classification === null ? "unclear" : r.classification ? "eligible" : "not eligible";
    md += `| ${r.mode} | ${r.personaId} | ${r.schemeName} | ${r.expected ? "eligible" : "not eligible"} | ${said} | ${r.correct ? "✓" : "✗"} | ${r.latencyMs} |\n`;
  }

  return md;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing from .env.local — can't call any of the three architectures. Aborting.");
    process.exit(1);
  }

  const personas = QUICK ? PERSONAS.slice(0, 1) : PERSONAS;
  const records = [];

  for (const persona of personas) {
    const questions = buildQuestionsForPersona(persona);
    const sentence = personaToSentence(persona.profile);

    for (const q of questions) {
      const questionText = `${sentence} Am I eligible for the "${q.schemeName}" scheme? Answer with exactly one word first — "Yes" or "No" — then a one-sentence explanation.`;

      for (const mode of Object.keys(MODES)) {
        process.stdout.write(`[${mode}] ${persona.id} / ${q.schemeKey} ... `);
        const record = await runOne(mode, q, questionText);
        console.log(record.error ? `ERROR (${record.error})` : `${record.correct ? "correct" : "WRONG"} (${record.latencyMs}ms)`);
        records.push(record);
        await sleep(DELAY_MS);
      }
    }
  }

  // Language robustness pilot — one Hindi question, all three modes, logged raw (not auto-scored)
  const hindiPilot = [];
  if (!QUICK) {
    for (const mode of Object.keys(MODES)) {
      process.stdout.write(`[${mode}] hindi-pilot / ${HINDI_PILOT_QUESTION.schemeKey} ... `);
      const record = await runOne(mode, HINDI_PILOT_QUESTION, HINDI_PILOT_QUESTION.text);
      console.log(record.error ? `ERROR (${record.error})` : "done");
      hindiPilot.push(record);
      await sleep(DELAY_MS);
    }
  }

  const byMode = summarize(records);

  mkdirSync("eval/results", { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(`eval/results/results-${timestamp}.json`, JSON.stringify({ records, hindiPilot, summary: byMode }, null, 2));
  writeFileSync("eval/results/summary.md", toMarkdown(byMode, records, hindiPilot));

  console.log("\n=== Summary ===");
  console.table(byMode);
  console.log(`\nFull results: eval/results/results-${timestamp}.json`);
  console.log("Markdown summary: eval/results/summary.md");
}

main().catch((err) => {
  console.error("Evaluation run failed:", err);
  process.exit(1);
});
