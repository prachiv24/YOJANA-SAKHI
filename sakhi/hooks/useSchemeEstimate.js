// hooks/useSchemeEstimate.js
//
// Shared client-side logic for calling /api/schemes/estimate-eligibility, keyed by
// scheme title. Used by both app/scheme-discovery/page.js and app/eligibility/page.js
// so the "AI-estimated eligibility for a RAG-only scheme" flow behaves identically
// (and is maintained in one place) everywhere it appears in the app.

import { useCallback, useState } from "react";

export function useSchemeEstimate(sessionId) {
  const [estimates, setEstimates] = useState({}); // { [title]: { loading, result, error } }

  const runEstimate = useCallback(
    async (title, content) => {
      if (!sessionId) return;

      setEstimates((prev) => ({ ...prev, [title]: { loading: true } }));

      try {
        const res = await fetch("/api/schemes/estimate-eligibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, schemeTitle: title, schemeContent: content }),
        });
        const data = await res.json();

        if (!res.ok) {
          setEstimates((prev) => ({ ...prev, [title]: { loading: false, error: data.error || "Estimate failed." } }));
          return;
        }

        setEstimates((prev) => ({ ...prev, [title]: { loading: false, result: data } }));
      } catch (err) {
        setEstimates((prev) => ({ ...prev, [title]: { loading: false, error: "Couldn't reach the server." } }));
      }
    },
    [sessionId]
  );

  return { estimates, runEstimate };
}
