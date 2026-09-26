// agents/plannerV2.js
//
// V2 of the BTP's three-way comparison: retrieval-augmented, but still a
// single LLM call — no tool-calling loop, no deterministic eligibility
// engine. The citizen's message is used as a semantic search query against
// the scheme corpus (lib/ragSearch.js — the same retrieval V3 exposes via
// the search_schemes tool), the top matches are stuffed into the prompt as
// context, and Gemini answers once, grounded in that text.
//
// This isolates exactly one variable against V1 (retrieval vs. no
// retrieval) and exactly one variable against V3 (single-shot-over-context
// vs. an agentic tool loop with a deterministic eligibility engine as the
// actual source of truth) — which is the point of a controlled
// architecture comparison.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchSchemeDocuments } from "../lib/ragSearch.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const V2_SYSTEM_PROMPT = `You are a helpful assistant for Indian citizens asking about government
welfare schemes (central and state). You will be given CONTEXT — excerpts retrieved from a scheme
database — before each question. Base your answer on that context wherever it's relevant. If the
context doesn't cover something, say you're not certain rather than inventing details. Be concise
and specific (scheme names, amounts, eligibility conditions).`;

const model = genAI.getGenerativeModel({
  model: "gemini-3.8-flash",
  systemInstruction: { role: "system", parts: [{ text: V2_SYSTEM_PROMPT }] },
});

function buildContextBlock(results) {
  if (!results.length) return "CONTEXT: (no matching schemes found in the database)";

  const excerpts = results
    .map((r, i) => `[${i + 1}] ${r.title}${r.state ? ` (${r.state})` : ""}\n${r.excerpt ?? r.content}`)
    .join("\n\n");

  return `CONTEXT (retrieved scheme excerpts, most relevant first):\n\n${excerpts}`;
}

/**
 * @param {string} sessionId - unused beyond matching V1/V3's call signature.
 * @param {import('./planner.js').ChatMessage[]} history
 * @param {string} userMessage
 * @returns {Promise<import('./planner.js').PlannerResult & {retrieved: object[]}>}
 */
export async function runPlannerTurnV2(sessionId, history, userMessage) {
  const { mode, results } = await searchSchemeDocuments(userMessage, { matchCount: 5 });

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

  const promptWithContext = `${buildContextBlock(results)}\n\nQUESTION: ${userMessage}`;
  const response = (await chat.sendMessage(promptWithContext)).response;
  const finalText = response.text();

  return {
    messages: [...history, { role: "user", content: userMessage }, { role: "assistant", content: finalText }],
    finalText,
    toolCallsExecuted: [{ name: "search_schemes", input: { query: userMessage }, result: { mode, count: results.length } }],
    retrieved: results,
  };
}
