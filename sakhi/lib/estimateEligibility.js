// lib/estimateEligibility.js
//
// For the ~30 hand-curated schemes in data/schemes.js, eligibility is decided by
// lib/eligibility.js's deterministic rule engine — verifiable, testable, the actual
// source of truth. For the much larger RAG corpus (data/corpus/myscheme-schemes.json,
// ~3,400 schemes), there ARE no structured rules — only the scheme's free-text
// eligibility/benefits/documents description. There's no honest way to give those
// 3,000+ schemes the same deterministic guarantee without hand-writing rules for
// each one, which isn't feasible at this scale and also isn't the point: this BTP's
// whole thesis is that broad-but-model-interpreted (RAG) and narrow-but-verified
// (deterministic) are genuinely different reliability tiers.
//
// So this is a clearly separate, clearly labeled thing: one LLM call reads the
// citizen's profile + a scheme's retrieved text and produces a best-effort verdict
// with a confidence score. It is NEVER presented as equivalent to
// lib/eligibility.js's output — every caller of this must show it as an estimate,
// not a determination. See the `estimated: true` flag on the result and use it.

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ESTIMATE_SYSTEM_PROMPT = `You assess whether an Indian citizen likely qualifies for a
government welfare scheme, based on their profile and the scheme's own description. You are
giving a best-effort estimate, not an authoritative determination — the citizen should verify
with the actual department before relying on this.

Respond with ONLY a JSON object (no markdown fences, no other text) in exactly this shape:
{
  "verdict": "eligible" | "not_eligible" | "uncertain",
  "confidence": <integer 0-100>,
  "reasoning": "<one or two sentences, citing the specific profile fields and scheme conditions that drove the verdict>",
  "requiredDocuments": ["<document name>", ...]
}

Use "uncertain" (not a forced yes/no) whenever the scheme's description doesn't give you enough
information to decide, or the citizen's profile is missing a fact the scheme's conditions
depend on — do not guess. "requiredDocuments" should be extracted from the scheme's own text
(often under a "documents" section); return an empty array if none are mentioned.`;

const model = genAI.getGenerativeModel({
  model: "gemini-3.8-flash",
  systemInstruction: { role: "system", parts: [{ text: ESTIMATE_SYSTEM_PROMPT }] },
  generationConfig: { responseMimeType: "application/json" },
});

function profileToSentence(profile) {
  const parts = Object.entries(profile || {})
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${v}`);

  return parts.length ? parts.join(", ") : "(no profile details provided)";
}

/**
 * @param {object} profile - citizen profile, same shape lib/eligibility.js expects
 *   (age, gender, maritalStatus, state, incomeAnnual, bplCard, aadhaarLinked, dependents,
 *   landOwned, occupation, socialCategory, disability, residenceType, ...) — partial is fine.
 * @param {{title: string, content: string}} scheme - the scheme's retrieved title + text
 * @returns {Promise<{estimated: true, verdict: "eligible"|"not_eligible"|"uncertain", confidence: number, reasoning: string, requiredDocuments: string[]}|{estimated: true, error: string}>}
 */
export async function estimateSchemeEligibility(profile, scheme) {
  if (!process.env.GEMINI_API_KEY) {
    return { estimated: true, error: "GEMINI_API_KEY isn't configured — can't run an estimate." };
  }

  const prompt = `CITIZEN PROFILE: ${profileToSentence(profile)}\n\nSCHEME: ${scheme.title}\n${scheme.content}`;

  try {
    const response = (await model.generateContent(prompt)).response;
    const text = response.text();
    const parsed = JSON.parse(text);

    const verdict = ["eligible", "not_eligible", "uncertain"].includes(parsed.verdict)
      ? parsed.verdict
      : "uncertain";
    const confidence = Number.isFinite(parsed.confidence) ? Math.max(0, Math.min(100, Math.round(parsed.confidence))) : 0;

    return {
      estimated: true,
      verdict,
      confidence,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      requiredDocuments: Array.isArray(parsed.requiredDocuments) ? parsed.requiredDocuments.filter((d) => typeof d === "string") : [],
    };
  } catch (err) {
    console.error("[estimateEligibility] failed:", err.message);
    return { estimated: true, error: "Couldn't get an estimate right now — try again in a moment." };
  }
}
