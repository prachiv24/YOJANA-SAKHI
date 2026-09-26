// server/assistantService.js
//
// One service, six jobs — all reusing the existing scheme data shape
// (scheme.gapMessage, scheme.requiredDocuments, etc). No separate "chatbot"
// with open-ended scheme knowledge — every call is grounded in real data
// passed in, so it can't hallucinate scheme rules.
//
// Uses the same Gemini model + API key as agents/planner.js (GEMINI_API_KEY)
// so this works out of the box without needing a separate Anthropic key.

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

async function callGemini({ system, prompt, maxTokens = 400 }) {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { role: "system", parts: [{ text: system }] },
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
  });

  return (result.response.text() || "").trim();
}

function stripFences(text) {
  return text.replace(/```json|```/g, "").trim();
}

/**
 * 1. GAP EXPLAINER
 * Turns failed eligibility rules into a warm, actionable explanation.
 */
async function explainEligibilityGap({ scheme, failedRules, profile, lang = "en" }) {
  const gapList = (failedRules || []).map((r) => `- ${r.gapMessage}`).join("\n");

  const system = `You are a warm, practical assistant inside "Yojana Sakhi," an Indian government scheme
navigator app. You explain WHY someone doesn't currently qualify for a scheme, and what
would need to change, in plain ${lang === "hi" ? "Hindi" : "English"}.

Rules:
- Use ONLY the gap reasons provided. Never invent eligibility rules or numbers.
- Keep it under 60 words.
- Be encouraging, not bureaucratic. No jargon.
- If a gap looks fixable (e.g. getting a certificate), say how, briefly.
- If a gap is fixed by circumstance (e.g. age), just state it factually, don't imply they should lie or wait pointlessly.
- Do not mention you are an AI or reference "the system."`;

  const prompt = `Scheme: ${scheme.name} (${scheme.nameLocal || ""})
Benefit: ${scheme.benefitAmount}

Unmet eligibility conditions:
${gapList}

Applicant profile summary: ${JSON.stringify(profile)}

Write the explanation now.`;

  return callGemini({ system, prompt, maxTokens: 200 });
}

/**
 * 2. OCR FALLBACK CONVERSATION
 * When OCR fails on a document, ask a short, specific question instead of
 * showing a raw error.
 */
async function ocrFallbackQuestion({ documentName, expectedField, lang = "en" }) {
  const system = `You are a friendly assistant helping someone upload a document for a government
scheme application in India. Their document couldn't be read automatically (OCR failed).
Instead of showing an error, ask ONE short, specific question to get the needed information
as plain text. Respond in ${lang === "hi" ? "Hindi" : "English"}. Max 25 words. No apology-heavy
language, just a helpful, calm ask.`;

  const prompt = `Document: ${documentName}
Information we still need from it: ${expectedField}

Ask the question now.`;

  return callGemini({ system, prompt, maxTokens: 80 });
}

/**
 * Parses a free-text answer given in response to an OCR fallback question
 * into a structured value. Returns { value, confident: boolean }.
 */
async function parseFallbackAnswer({ expectedField, expectedType, userAnswer }) {
  const system = `Extract a single structured value from a user's free-text answer.
Respond ONLY with JSON, no preamble, no markdown fences.
Format: {"value": <parsed value or null>, "confident": true|false}
If the answer is genuinely ambiguous or missing, set value to null and confident to false.`;

  const prompt = `Field needed: ${expectedField}
Expected type: ${expectedType} (e.g. number, boolean, date, string)
User's answer: "${userAnswer}"`;

  const raw = await callGemini({ system, prompt, maxTokens: 100 });

  try {
    return JSON.parse(stripFences(raw));
  } catch {
    return { value: null, confident: false };
  }
}

/**
 * 3. DOCUMENT CHECKLIST ASSISTANT
 * Reorders requiredDocuments by ease-of-acquisition and adds a short tip
 * for any the user doesn't already have.
 */
async function annotateDocumentChecklist({ scheme, docsUserHas = [] }) {
  const system = `You help order a document checklist for an Indian government scheme application,
easiest-to-obtain first, and add a one-line practical tip for getting each document if the
user doesn't already have it. Respond ONLY with JSON, no markdown fences.
Format: [{"id": "...", "tip": "..."}], in the new recommended order.
Keep each tip under 15 words. Use only the documents given — do not invent new ones.`;

  const prompt = `Documents required for ${scheme.name}:
${JSON.stringify(scheme.requiredDocuments)}

Documents the user already has: ${JSON.stringify(docsUserHas)}

Return the reordered, annotated list now.`;

  const raw = await callGemini({ system, prompt, maxTokens: 400 });

  try {
    return JSON.parse(stripFences(raw));
  } catch {
    return (scheme.requiredDocuments || []).map((d) => ({ id: d.id, tip: "" }));
  }
}

/**
 * 4. POST-APPLICATION NEXT STEPS
 * Plain-language summary of what happens after "Apply".
 */
async function explainNextSteps({ scheme, lang = "en" }) {
  const system = `You explain, in plain ${lang === "hi" ? "Hindi" : "English"}, what typically
happens after someone applies for an Indian government scheme. Be realistic and calm — mention
typical processing expectations and what to do if there's no update or if rejected. Do not invent
scheme-specific timelines you don't know; speak generally about DBT-based govt scheme processing.
Max 70 words.`;

  const prompt = `Scheme applied for: ${scheme.name}
Application portal: ${scheme.applicationUrl}

Write the next-steps summary now.`;

  return callGemini({ system, prompt, maxTokens: 200 });
}

/**
 * 5. DOCUMENT-TO-FORM VERIFICATION
 * Cross-checks OCR-extracted fields from an uploaded document against
 * what the applicant typed into the form/profile. Catches typos, wrong
 * document uploads, and mismatched identity details before submission.
 *
 * Output: { matches: boolean, mismatches: [{ field, formValue, documentValue, severity, note }] }
 * severity: "critical" (blocks submission, e.g. name/DOB mismatch) | "minor" (flag only).
 */
async function verifyDocumentMatch({ documentName, extractedFields, formValues, fieldMap = {} }) {
  const system = `You cross-check a government-scheme applicant's form entries against data extracted
from an uploaded supporting document, to catch mismatches before submission.

Rules:
- Compare ONLY the fields given. Do not invent fields or assume unstated ones match.
- Minor formatting differences (e.g. "Ramesh Kumar" vs "RAMESH KUMAR", "01/02/1990" vs "1990-02-01",
  ₹1,50,000 vs 150000) are NOT mismatches — normalize before comparing.
- A genuine mismatch is when the underlying value is actually different (different name, different
  date, income differing by more than a small rounding margin).
- Classify each real mismatch as "critical" (identity fields: name, DOB, relationship — these mean
  the wrong document may have been uploaded, or the form has an error) or "minor" (small numeric
  variance that likely doesn't affect eligibility).
- Respond ONLY with JSON, no markdown fences, in this exact shape:
  {"matches": true|false, "mismatches": [{"field": "...", "formValue": "...", "documentValue": "...", "severity": "critical|minor", "note": "short plain-language explanation"}]}
- If everything matches, return {"matches": true, "mismatches": []}.
- If either formValues or extractedFields is empty/has nothing to compare, return {"matches": true, "mismatches": []}.`;

  const prompt = `Document: ${documentName}
Field mapping (form field -> document field): ${JSON.stringify(fieldMap)}

Values entered in the form/profile: ${JSON.stringify(formValues)}
Values extracted from the document (OCR): ${JSON.stringify(extractedFields)}

Compare and return the JSON result now.`;

  const raw = await callGemini({ system, prompt, maxTokens: 400 });

  try {
    const parsed = JSON.parse(stripFences(raw));
    return {
      matches: parsed.matches !== false,
      mismatches: Array.isArray(parsed.mismatches) ? parsed.mismatches : [],
    };
  } catch {
    // Fail safe: if parsing breaks, don't silently pass verification —
    // surface as "needs manual check" rather than false-positive matching.
    return {
      matches: false,
      mismatches: [
        {
          field: "unknown",
          formValue: null,
          documentValue: null,
          severity: "minor",
          note: "Could not automatically verify this document — please check manually.",
        },
      ],
    };
  }
}

export {
  explainEligibilityGap,
  ocrFallbackQuestion,
  parseFallbackAnswer,
  annotateDocumentChecklist,
  explainNextSteps,
  verifyDocumentMatch,
};
