"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SCHEMES } from "../../data/schemes.js";
import { useSession } from "../../context/SessionContext.js";

const SCHEME_ICON = {
  pension: "👵",
  housing: "🏠",
  "financial-inclusion": "🏦",
  agriculture: "🌾",
  household: "🔥",
  health: "❤️",
};

export default function Page() {
  const { sessionId } = useSession();

  const [savedRows, setSavedRows] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [removingId, setRemovingId] = useState(null);

  const loadSaved = useCallback(() => {
    if (!sessionId) return;
    setLoading(true);
    setError("");

    fetch(`/api/saved-schemes?sessionId=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSavedRows(data.savedSchemes || []);
      })
      .catch((err) => {
        setError(err.message || "Could not load saved schemes");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  async function handleRemove(schemeId) {
    if (!sessionId) return;
    setRemovingId(schemeId);
    try {
      await fetch(
        `/api/saved-schemes?sessionId=${encodeURIComponent(sessionId)}&schemeId=${encodeURIComponent(schemeId)}`,
        { method: "DELETE" }
      );
      setSavedRows((prev) => prev.filter((r) => r.scheme_id !== schemeId));
    } catch (err) {
      console.error("Could not remove scheme:", err);
    } finally {
      setRemovingId(null);
    }
  }

  const savedIdSet = new Set(savedRows.map((r) => r.scheme_id));
  const savedSchemes = SCHEMES.filter((s) => savedIdSet.has(s.id));
  // Saved rows whose scheme_id isn't one of the local 30 — these are RAG-corpus
  // schemes, saved from Scheme Discovery's browse/search sections, and render
  // from their own stored title/source_url rather than a data/schemes.js lookup.
  const savedRagSchemes = savedRows.filter((r) => !SCHEMES.some((s) => s.id === r.scheme_id));

  return (
    <div>
      <div className="page-header">
        <h1>Saved Schemes</h1>
      </div>

      {!sessionId && (
        <div className="placeholder-card">
          <div className="icon">🔖</div>
          <h2>No active session found</h2>
          <p>Please start from your profile or a scheme page first.</p>
        </div>
      )}

      {sessionId && loading && (
        <div className="placeholder-card">
          <div className="icon">⏳</div>
          <h2>Loading your saved schemes...</h2>
        </div>
      )}

      {sessionId && !loading && error && (
        <div className="placeholder-card">
          <div className="icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
        </div>
      )}

      {sessionId && !loading && !error && savedSchemes.length === 0 && savedRagSchemes.length === 0 && (
        <div className="placeholder-card">
          <div className="icon">🔖</div>
          <h2>No saved schemes yet</h2>
          <p>Bookmark schemes from Scheme Discovery to see them here.</p>
        </div>
      )}

      {sessionId && !loading && !error && savedSchemes.length > 0 && (
        <div className="scheme-cards-grid">
          {savedSchemes.map((s) => (
            <div key={s.id} className="scheme-card">
              <div className="scheme-card-top">
                <span className="scheme-icon">{SCHEME_ICON[s.category] || "📜"}</span>
                <div style={{ flex: 1 }}>
                  <div className="scheme-card-title">{s.name}</div>
                  <div className="scheme-card-local">{s.nameLocal}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(s.id)}
                  disabled={removingId === s.id}
                  title="Remove from saved schemes"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "20px",
                    lineHeight: 1,
                    opacity: removingId === s.id ? 0.5 : 1,
                    padding: "4px",
                  }}
                >
                  🔖
                </button>
              </div>
              <div className="scheme-card-desc">{s.description}</div>
              <div className="scheme-card-meta">
                <span>{s.state === "central" ? "Central Scheme" : s.state}</span>
                <span className="scheme-card-benefit">{s.benefitAmount}</span>
              </div>
              <div className="result-actions">
                <Link href={`/eligibility`} className="btn-link">Check eligibility →</Link>
                <Link href={`/documents?scheme=${s.id}`} className="btn-link">View documents →</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {sessionId && !loading && !error && savedRagSchemes.length > 0 && (
        <div style={{ marginTop: savedSchemes.length > 0 ? "32px" : 0 }}>
          <div className="section-title">From the full scheme database</div>
          <p style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: -4, marginBottom: 12 }}>
            Saved from the broader 3,000+ scheme corpus — use &quot;Ask the assistant&quot; for a
            preliminary, AI-estimated eligibility read, since these don&apos;t have the verified
            structured checker the schemes above do.
          </p>
          <div className="scheme-cards-grid">
            {savedRagSchemes.map((r) => (
              <div key={r.scheme_id} className="scheme-card">
                <div className="scheme-card-top">
                  <span className="scheme-icon">📜</span>
                  <div style={{ flex: 1 }}>
                    <div className="scheme-card-title">{r.title || r.scheme_id}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(r.scheme_id)}
                    disabled={removingId === r.scheme_id}
                    title="Remove from saved schemes"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1, opacity: removingId === r.scheme_id ? 0.5 : 1, padding: "4px" }}
                  >
                    🔖
                  </button>
                </div>
                <div className="result-actions">
                  <Link href="/ai-assistant" className="btn-link">Ask the assistant about this →</Link>
                  {r.source_url && (
                    <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="btn-link">
                      Official source →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}