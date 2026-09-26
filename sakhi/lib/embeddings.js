// lib/embeddings.js
//
// Thin wrapper around Gemini's embedding model, shared by the ingestion
// script (lib/embeddings.js -> scripts/ingest-schemes.js) and the live
// query path (lib/ragSearch.js). Uses the same GEMINI_API_KEY the rest of
// the app already reads — no new env var or dependency needed.

import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 3072;

let embeddingModel = null;

function getEmbeddingModel() {
  if (!process.env.GEMINI_API_KEY) return null;

  if (!embeddingModel) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  }

  return embeddingModel;
}

/**
 * Embeds a single string. `taskType` should be "RETRIEVAL_DOCUMENT" when
 * embedding corpus chunks at ingest time, and "RETRIEVAL_QUERY" when
 * embedding a citizen's question at search time — Gemini's embedding model
 * is trained asymmetrically, so matching these correctly meaningfully
 * improves retrieval quality over using the same task type for both.
 *
 * Returns null (rather than throwing) if GEMINI_API_KEY isn't set, so
 * callers can fall back to keyword search — same "degrade, don't crash"
 * pattern as lib/supabase.js.
 */
export async function embedText(text, taskType = "RETRIEVAL_DOCUMENT") {
  const model = getEmbeddingModel();
  if (!model) return null;

  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    taskType,
  });

  return result.embedding.values;
}

/**
 * Embeds many strings sequentially with a small delay between calls to stay
 * comfortably under the free-tier embedding rate limit. For a corpus in the
 * thousands this takes a while (that's expected) — run it as a one-off
 * ingestion job, not on a request path.
 */
export async function embedTexts(texts, { taskType = "RETRIEVAL_DOCUMENT", delayMs = 150, onProgress } = {}) {
  const vectors = [];

  for (let i = 0; i < texts.length; i++) {
    vectors.push(await embedText(texts[i], taskType));
    onProgress?.(i + 1, texts.length);
    if (delayMs && i < texts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return vectors;
}

export { EMBEDDING_DIMENSIONS };
