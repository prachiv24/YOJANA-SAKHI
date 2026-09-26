// client/useAssistant.js
//
// Thin client for the /api/assistant endpoint. Every call has a static
// fallback string so the UI NEVER shows a raw error or empty state,
// even if the API key is missing, rate-limited, or the network fails.

import { useState, useCallback } from "react";
import ASSISTANT_CACHE from "../cache/assistant-cache.json";

// Same key logic as scripts/generate-cache.js — keep the two in sync.
// A cache "hit" means this exact mode + payload was pre-generated, so the
// demo doesn't need network access for that specific scheme/profile/doc.
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

async function callAssistant(mode, payload) {
  const key = cacheKey(mode, payload);
  if (Object.prototype.hasOwnProperty.call(ASSISTANT_CACHE, key)) {
    return ASSISTANT_CACHE[key];
  }

  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, payload }),
  });
  const data = await res.json();
  if (!data.result) throw new Error(data.error || "No result");
  return data.result;
}

export function useAssistant() {
  const [loading, setLoading] = useState(false);

  const explainGap = useCallback(async (scheme, failedRules, profile, lang = "en") => {
    setLoading(true);
    try {
      return await callAssistant("explain-gap", { scheme, failedRules, profile, lang });
    } catch {
      // Static fallback: just list the raw gap messages, still useful.
      return failedRules.map((r) => r.gapMessage).join(" ");
    } finally {
      setLoading(false);
    }
  }, []);

  const askOcrFallback = useCallback(async (documentName, expectedField, lang = "en") => {
    setLoading(true);
    try {
      return await callAssistant("ocr-fallback-question", { documentName, expectedField, lang });
    } catch {
      return `We couldn't read "${documentName}" automatically. Could you type in the ${expectedField}?`;
    } finally {
      setLoading(false);
    }
  }, []);

  const parseFallback = useCallback(async (expectedField, expectedType, userAnswer) => {
    setLoading(true);
    try {
      return await callAssistant("parse-fallback-answer", { expectedField, expectedType, userAnswer });
    } catch {
      return { value: userAnswer, confident: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocChecklist = useCallback(async (scheme, docsUserHas = []) => {
    setLoading(true);
    try {
      return await callAssistant("doc-checklist", { scheme, docsUserHas });
    } catch {
      return scheme.requiredDocuments.map((d) => ({ id: d.id, tip: "" }));
    } finally {
      setLoading(false);
    }
  }, []);

  const getNextSteps = useCallback(async (scheme, lang = "en") => {
    setLoading(true);
    try {
      return await callAssistant("next-steps", { scheme, lang });
    } catch {
      return `Your application for ${scheme.name} has been submitted. Processing usually takes a few weeks. Check status on ${scheme.applicationUrl}, or visit your local office if there's no update after a month.`;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyDocument = useCallback(async (documentName, extractedFields, formValues, fieldMap = {}) => {
    setLoading(true);
    try {
      return await callAssistant("verify-document", { documentName, extractedFields, formValues, fieldMap });
    } catch {
      // Fail safe, not fail open: don't silently say "matches" if the check itself broke.
      return {
        matches: false,
        mismatches: [
          {
            field: "unknown",
            formValue: null,
            documentValue: null,
            severity: "minor",
            note: "Couldn't verify this document automatically — please double check it yourself.",
          },
        ],
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    explainGap,
    askOcrFallback,
    parseFallback,
    getDocChecklist,
    getNextSteps,
    verifyDocument,
  };
}