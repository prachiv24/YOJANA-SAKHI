// lib/ragSearch.js
//
// Semantic search over the scheme corpus for free-text questions ("what
// documents do I need for a caste certificate", "are there schemes for
// disabled farmers in Bihar") that the ~30-scheme hand-coded eligibility
// engine (data/schemes.js + lib/eligibility.js) was never meant to answer.
//
// This is retrieval only — it never decides eligibility. The planner still
// must call check_eligibility for any eligibility claim (see
// agents/system-prompt.js); search_schemes just grounds general-knowledge
// answers in real scheme text instead of the model's own memory.
//
// Same "degrade, don't crash" pattern as lib/supabase.js, in four tiers,
// each only used when the one above it genuinely can't run:
//   1. Vector search (Gemini embedding + pgvector) — best quality.
//   2. Indexed Postgres full-text search over scheme_documents (ts_rank) —
//      used when embedding fails/unavailable; still searches the real
//      ingested corpus (e.g. 3,000+ schemes), just without semantic ranking.
//   3. Unindexed ILIKE scan over scheme_documents — only if the full-text
//      RPC isn't installed yet (migration not run against this project).
//   4. Keyword search over the bundled ~30-scheme seed corpus — only if
//      Supabase isn't configured at all, or the DB itself is unreachable.
// Tiers 2-4 must never be reached just because tier 1 was rate-limited or
// errored transiently — that would silently hide a real ingested corpus
// behind the tiny bundled demo data.

import { readFileSync } from "fs";
import { join } from "path";
import { supabase } from "./supabase.js";
import { embedText } from "./embeddings.js";

let seedCorpusCache = null;

function loadSeedCorpus() {
  if (seedCorpusCache) return seedCorpusCache;

  try {
    const raw = readFileSync(
      join(process.cwd(), "data", "corpus", "seed-corpus.json"),
      "utf-8"
    );
    seedCorpusCache = JSON.parse(raw);
  } catch (err) {
    console.error("[ragSearch] couldn't read seed corpus:", err.message);
    seedCorpusCache = [];
  }

  return seedCorpusCache;
}

/**
 * Dumb but dependency-free relevance score: fraction of the query's
 * significant words that appear in the document. Good enough as a fallback
 * when there's no embedding/vector search available — not a replacement
 * for real semantic search.
 */
function keywordScore(query, content) {
  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  if (!words.length) return 0;

  const lowerContent = content.toLowerCase();
  const hits = words.filter((w) => lowerContent.includes(w)).length;

  return hits / words.length;
}

function keywordSearch(query, { matchCount = 5, state = null } = {}) {
  const corpus = loadSeedCorpus();

  return corpus
    .filter((doc) => !state || doc.state === state || doc.state === "central")
    .map((doc) => ({ ...doc, similarity: keywordScore(query, doc.content) }))
    .filter((doc) => doc.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

/**
 * Unindexed keyword scan over scheme_documents via `content ILIKE '%word%'`.
 * Works with zero schema changes, but it's a full sequential scan of every
 * row's text — fine at seed-corpus scale, not great across ~3,000+ rows.
 * Kept only as a last-resort fallback for deployments that haven't run the
 * `keyword_search_scheme_documents` migration in db/rag_schema.sql yet, so
 * this codepath still works out of the box on an older schema.
 *
 * Returns `null` (rather than an empty array) on a genuine query failure, so
 * the caller can distinguish "DB reachable, no matches" from "couldn't even
 * reach the DB" and fall back further only in the latter case.
 *
 * @returns {Promise<object[]|null>}
 */
async function ilikeKeywordSearch(query, { matchCount = 5, state = null } = {}) {
  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  if (!words.length) return [];

  let dbQuery = supabase
    .from("scheme_documents")
    .select("id, scheme_id, title, state, category, source_url, content")
    .or(words.map((w) => `content.ilike.%${w}%`).join(","))
    .limit(200);

  if (state) dbQuery = dbQuery.or(`state.eq.${state},state.eq.central`);

  const { data, error } = await dbQuery;

  if (error) {
    console.error("[ragSearch] ILIKE keyword search over scheme_documents failed:", error.message);
    return null;
  }

  return (data || [])
    .map((doc) => ({ ...doc, similarity: keywordScore(query, doc.content) }))
    .filter((doc) => doc.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

/**
 * Keyword fallback that searches the *real* ingested table (scheme_documents),
 * not the bundled 30-scheme seed corpus. Used when Supabase is configured but
 * embedding a query fails or isn't available (missing GEMINI_API_KEY, rate
 * limit, transient Gemini error, etc) — so a real ~3,000+ scheme deployment
 * still searches its own data instead of silently degrading to the tiny demo
 * corpus meant for local dev without Supabase set up.
 *
 * Two-tier itself: tries the indexed Postgres full-text search RPC first
 * (fast, relevance-ranked — see db/rag_schema.sql section 5), and only drops
 * to the unindexed ILIKE scan if that RPC isn't installed yet (e.g. the
 * migration hasn't been run against this Supabase project), so upgrading is
 * opt-in rather than a hard requirement.
 *
 * Returns `null` (rather than an empty array) only if BOTH tiers fail, so
 * the caller can tell "DB reachable, no matches" apart from "couldn't reach
 * the DB at all" and fall back further only in the latter case.
 *
 * @returns {Promise<object[]|null>}
 */
async function supabaseKeywordSearch(query, { matchCount = 5, state = null } = {}) {
  try {
    const { data, error } = await supabase.rpc("keyword_search_scheme_documents", {
      search_query: query,
      match_count: matchCount,
      filter_state: state,
    });

    if (error) throw error;
    if (data) return data;
  } catch (err) {
    // Most likely cause: the migration adding this RPC hasn't been run yet
    // against this Supabase project. Fall back to the unindexed scan rather
    // than failing outright.
    console.warn(
      "[ragSearch] keyword_search_scheme_documents RPC unavailable (run db/rag_schema.sql section 5 to enable indexed full-text fallback search), using ILIKE scan instead:",
      err.message
    );
  }

  return ilikeKeywordSearch(query, { matchCount, state });
}

/**
 * Main entry point used by agents/tool-executor.js's search_schemes tool.
 * See the module-level comment for the full four-tier fallback order.
 *
 * @param {string} query - the citizen's free-text question
 * @param {{matchCount?: number, state?: string|null}} options
 * @returns {Promise<{status: string, mode: "vector"|"keyword-db"|"keyword", results: object[]}>}
 */
export async function searchSchemeDocuments(query, { matchCount = 5, state = null } = {}) {
  if (supabase) {
    try {
      const queryEmbedding = await embedText(query, "RETRIEVAL_QUERY");

      if (queryEmbedding) {
        const { data, error } = await supabase.rpc("match_scheme_documents", {
          query_embedding: queryEmbedding,
          match_count: matchCount,
          filter_state: state,
        });

        if (error) throw error;

        if (data && data.length) {
          return { status: "ok", mode: "vector", results: data };
        }
        // data.length === 0 is a legitimate "nothing indexed yet" case (the
        // table is genuinely empty) — fall through to the seed corpus below.
      } else {
        // GEMINI_API_KEY missing / embedding unavailable, but Supabase *is*
        // configured — search the real ingested table by keyword before
        // ever touching the seed corpus.
        const dbResults = await supabaseKeywordSearch(query, { matchCount, state });
        if (dbResults !== null) {
          return { status: "ok", mode: "keyword-db", results: dbResults };
        }
      }
    } catch (err) {
      // Vector search itself failed (rate limit, transient Gemini/Supabase
      // error, etc). Do NOT fall straight to the tiny bundled seed corpus —
      // that would hide the real ~3,000+ ingested schemes behind ~30 demo
      // ones. Degrade to a keyword search over the *real* scheme_documents
      // table first, and only fall back to the seed corpus if that also
      // fails (e.g. the DB itself is unreachable).
      console.error("[ragSearch] vector search failed, trying keyword search over scheme_documents:", err.message);

      const dbResults = await supabaseKeywordSearch(query, { matchCount, state });
      if (dbResults !== null) {
        return { status: "ok", mode: "keyword-db", results: dbResults };
      }
      console.error("[ragSearch] keyword search over scheme_documents also failed, falling back to seed corpus");
    }
  }

  return { status: "ok", mode: "keyword", results: keywordSearch(query, { matchCount, state }) };
}

/**
 * Plain paginated listing of the ingested corpus — no query, no embedding
 * call. This is what lets Scheme Discovery actually browse everything
 * you've run through scripts/ingest-schemes.js (e.g. 3,000+ myScheme
 * entries), not just the ~30 in data/schemes.js. searchSchemeDocuments()
 * above only ever surfaces ingested schemes when someone types a matching
 * query; without this, a big ingested corpus is invisible in the UI except
 * through search.
 *
 * @param {{page?: number, pageSize?: number, state?: string|null, category?: string|null}} options
 * @returns {Promise<{status: string, total: number, page: number, pageSize: number, results: object[]}>}
 */
export async function listSchemeDocuments({ page = 1, pageSize = 24, state = null, category = null } = {}) {
  if (!supabase) {
    // No Supabase configured — fall back to paging over the bundled seed corpus so
    // this still returns *something* consistent in local dev without Supabase set up.
    const corpus = loadSeedCorpus().filter(
      (doc) => (!state || doc.state === state) && (!category || doc.category === category)
    );
    const start = (page - 1) * pageSize;
    return { status: "ok", total: corpus.length, page, pageSize, results: corpus.slice(start, start + pageSize) };
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("scheme_documents")
    .select("id, scheme_id, title, state, category, source_url, content", { count: "exact" })
    .order("title", { ascending: true })
    .range(start, end);

  if (state) query = query.or(`state.eq.${state},state.eq.central`);
  if (category) query = query.eq("category", category);

  const { data, error, count } = await query;

  if (error) {
    console.error("[ragSearch] listSchemeDocuments failed:", error.message);
    return { status: "error", total: 0, page, pageSize, results: [] };
  }

  return { status: "ok", total: count ?? data.length, page, pageSize, results: data };
}
