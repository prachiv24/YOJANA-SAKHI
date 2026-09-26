import { evaluateAllSchemes, computeClaimReadiness } from "../lib/eligibility.js";
import { SCHEMES } from "../data/schemes.js";
import { supabase } from "../lib/supabase.js";
import { searchSchemeDocuments } from "../lib/ragSearch.js";

// -----------------------------
// FALLBACK MEMORY (used when Supabase isn't configured, or a read/write fails)
// -----------------------------
const sessionProfiles = new Map();
const sessionVerifiedDocs = new Map();

// -----------------------------
// SCHEME LOOKUP
// -----------------------------
// The model is expected to pass the exact scheme `id` (e.g. "up-widow-pension"),
// but LLMs sometimes pass the human-readable `name` instead (e.g.
// "Vidhwa Pension Yojana (Widow Pension)"). Match on either so a single
// wording mismatch doesn't silently break the tool call.
function findScheme(identifier) {
  if (!identifier) return undefined;

  const normalized = String(identifier).trim().toLowerCase();

  return SCHEMES.find(
    (s) =>
      s.id.toLowerCase() === normalized ||
      s.name.toLowerCase() === normalized ||
      s.name.toLowerCase().includes(normalized) ||
      normalized.includes(s.id.toLowerCase())
  );
}

// -----------------------------
// LOAD PROFILE
// -----------------------------
export async function loadCitizenProfile(sessionId) {
  if (supabase) {
    const { data, error } = await supabase
      .from("citizen_profiles")
      .select("profile")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (!error && data?.profile) {
      return data.profile;
    }
  }

  return sessionProfiles.get(sessionId) ?? {};
}

// -----------------------------
// SAVE PROFILE
// -----------------------------
export async function saveCitizenProfile(sessionId, partial) {
  const existing = await loadCitizenProfile(sessionId);
  const merged = {
    ...existing,
    ...partial,
  };

  sessionProfiles.set(sessionId, merged);

  if (supabase) {
    const { error } = await supabase.from("citizen_profiles").upsert({
      session_id: sessionId,
      profile: merged,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase save error:", error.message);
    }
  }

  return merged;
}

// -----------------------------
// TOOL EXECUTOR
// -----------------------------
export async function executeTool(sessionId, toolName, toolInput) {
  switch (toolName) {
    // -----------------------------
    // SAVE PROFILE
    // -----------------------------
    case "save_citizen_profile": {
      const profile = await saveCitizenProfile(sessionId, toolInput);

      return {
        status: "saved",
        storage: supabase ? "supabase" : "memory",
        profile,
      };
    }

    // -----------------------------
    // CHECK ELIGIBILITY
    // -----------------------------
    case "check_eligibility": {
      const citizen = await loadCitizenProfile(sessionId);

      const results = evaluateAllSchemes(citizen, SCHEMES);

      return {
        status: "ok",

        eligibleSchemes: results
          .filter((r) => r.eligible)
          .map((r) => ({
            id: r.schemeKey,
            name: r.schemeName,
          })),

        partialMatches: results
          .filter((r) => !r.eligible)
          .map((r) => ({
            id: r.schemeKey,
            name: r.schemeName,
            matchedConditions: r.matchedConditions,
            totalConditions: r.totalConditions,
            gaps: r.gaps,
          })),
      };
    }

    // -----------------------------
    // DOCUMENT CHECKLIST
    // -----------------------------
    case "get_document_checklist": {
      const scheme = findScheme(toolInput.schemeId);

      if (!scheme) {
        return {
          status: "error",
          message: `Unknown scheme id: ${toolInput.schemeId}`,
        };
      }

      const verified = sessionVerifiedDocs.get(sessionId) ?? [];

      return {
        status: "ok",
        schemeName: scheme.name,

        documents: scheme.requiredDocuments.map((doc) => ({
          id: doc.id,
          name: doc.name,
          description: doc.description,
          verified: verified.includes(doc.id),
        })),
      };
    }

    // -----------------------------
    // CLAIM READINESS
    // -----------------------------
    case "get_claim_readiness": {
      const scheme = findScheme(toolInput.schemeId);

      if (!scheme) {
        return {
          status: "error",
          message: `Unknown scheme id: ${toolInput.schemeId}`,
        };
      }

      const citizen = await loadCitizenProfile(sessionId);

      const results = evaluateAllSchemes(citizen, SCHEMES);

      const eligibilityResult = results.find((r) => r.schemeKey === scheme.id);

      if (!eligibilityResult) {
        return {
          status: "error",
          message: "Run check_eligibility first.",
        };
      }

      const verified = sessionVerifiedDocs.get(sessionId) ?? [];

      const readiness = computeClaimReadiness(eligibilityResult, scheme, verified);

      return {
        status: "ok",
        ...readiness,
      };
    }

    // -----------------------------
    // RAG SEARCH
    // -----------------------------
    case "search_schemes": {
      const { query, state } = toolInput;

      if (!query || !query.trim()) {
        return { status: "error", message: "search_schemes requires a non-empty query." };
      }

      const { mode, results } = await searchSchemeDocuments(query, {
        matchCount: 5,
        state: state || null,
      });

      return {
        status: "ok",
        mode, // "vector" (semantic), "keyword-db" (keyword search over the real ingested table, used
              // when embedding fails/unavailable), or "keyword" (tiny bundled seed corpus — only
              // when Supabase itself isn't configured or unreachable)
        results: results.map((r) => ({
          schemeId: r.scheme_id,
          title: r.title,
          state: r.state,
          category: r.category,
          sourceUrl: r.source_url,
          excerpt: r.content,
        })),
      };
    }

    // -----------------------------
    // UNKNOWN TOOL
    // -----------------------------
    default:
      return {
        status: "error",
        message: `Unknown tool: ${toolName}`,
      };
  }
}