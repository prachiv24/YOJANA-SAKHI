// agents/plannerV1.js
//
// V1 of the BTP's three-way comparison: a plain single-shot LLM call, with
// NO tools, NO retrieval, and NO deterministic eligibility engine. This is
// the classic "just ask the model" baseline that RAG/agent papers compare
// against — Gemini answers purely from its own training-time knowledge of
// Indian government schemes, which is exactly the failure mode this BTP is
// meant to measure (unverifiable claims, no grounding, potential
// hallucination of scheme names/amounts/eligibility rules).
//
// Deliberately kept structurally parallel to agents/planner.js (V3) —
// same function signature and return shape — so scripts/evaluate.js can
// call all three interchangeably.

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const V1_SYSTEM_PROMPT = `You are a helpful assistant for Indian citizens asking about government
welfare schemes (central and state). Answer questions about scheme eligibility, benefits,
required documents, and how to apply, using your own knowledge. Be concise and specific
(scheme names, amounts, eligibility conditions) wherever you can. If you are not confident about
a specific detail, say so rather than guessing with false confidence.`;

const model = genAI.getGenerativeModel({
  model: "gemini-3.8-flash",
  systemInstruction: { role: "system", parts: [{ text: V1_SYSTEM_PROMPT }] },
});

/**
 * @param {string} sessionId - unused (V1 is stateless beyond the passed-in history) but kept
 *   for a matching call signature with V2/V3.
 * @param {import('./planner.js').ChatMessage[]} history
 * @param {string} userMessage
 * @returns {Promise<import('./planner.js').PlannerResult>}
 */
export async function runPlannerTurnV1(sessionId, history, userMessage) {
  const trimmedHistory = [...history];
  while (trimmedHistory.length && trimmedHistory[0].role === "assistant") {
    trimmedHistory.shift();
  }

  const chat = model.startChat({
    history: trimmedHistory.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  const response = (await chat.sendMessage(userMessage)).response;
  const finalText = response.text();

  return {
    messages: [...history, { role: "user", content: userMessage }, { role: "assistant", content: finalText }],
    finalText,
    toolCallsExecuted: [], // V1 has no tools — kept for shape-compatibility with V2/V3 results
  };
}
