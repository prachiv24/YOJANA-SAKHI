"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SCHEMES } from "../../data/schemes.js";
import { useSession } from "../../context/SessionContext";
import { useSchemeEstimate } from "../../hooks/useSchemeEstimate.js";
import EstimateBlock from "../../components/EstimateBlock.js";

const SCHEME_ICON = {
  pension: "👵",
  housing: "🏠",
  "financial-inclusion": "🏦",
  agriculture: "🌾",
  household: "🔥",
  health: "❤️",
};

const CATEGORIES = ["all", ...Array.from(new Set(SCHEMES.map((s) => s.category)))];

function slugifyTitle(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

export default function SchemeDiscoveryPage() {
  const { sessionId } = useSession();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  // Set of scheme IDs currently saved by this session, for instant UI feedback
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null); // which scheme is mid-request, to disable its button

  // RAG search results (semantic search over the full corpus, not just the
  // ~30 schemes with structured eligibility rules) — see /api/schemes/search
  // and lib/ragSearch.js. Debounced so we don't fire a search per keystroke.
  const [ragResults, setRagResults] = useState([]);
  const [ragMode, setRagMode] = useState(null); // "vector" once you've ingested real data, "keyword" until then
  const [ragLoading, setRagLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setRagResults([]);
      setRagMode(null);
      return;
    }

    let cancelled = false;
    setRagLoading(true);

    const timer = setTimeout(() => {
      fetch("/api/schemes/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, matchCount: 8 }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setRagResults(data.results || []);
          setRagMode(data.mode || null);
        })
        .catch((err) => console.error("Scheme search failed:", err))
        .finally(() => !cancelled && setRagLoading(false));
    }, 350); // debounce — wait for the person to stop typing

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  // Load existing saved schemes once we have a sessionId
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    fetch(`/api/saved-schemes?sessionId=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const ids = new Set((data.savedSchemes || []).map((s) => s.scheme_id));
        setSavedIds(ids);
      })
      .catch((err) => console.error("Could not load saved schemes:", err));

    return () => { cancelled = true; };
  }, [sessionId]);

  const toggleSave = useCallback(async (schemeId, isSaved, meta = null) => {
    if (!sessionId) return;
    setSavingId(schemeId);

    try {
      if (isSaved) {
        // Unsave
        await fetch(
          `/api/saved-schemes?sessionId=${encodeURIComponent(sessionId)}&schemeId=${encodeURIComponent(schemeId)}`,
          { method: "DELETE" }
        );
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(schemeId);
          return next;
        });
      } else {
        // Save — meta.title/meta.sourceUrl are only sent for RAG-corpus schemes
        // (see db/saved_schemes_rag_migration.sql), so the Saved Schemes page can
        // display them without needing a local data/schemes.js lookup.
        await fetch("/api/saved-schemes", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ sessionId, schemeId, ...(meta || {}) }),
        });
        setSavedIds((prev) => new Set(prev).add(schemeId));
      }
    } catch (err) {
      console.error("Could not update saved scheme:", err);
    } finally {
      setSavingId(null);
    }
  }, [sessionId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SCHEMES.filter((s) => {
      const matchesCategory = category === "all" || s.category === category;
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const localIds = useMemo(() => new Set(SCHEMES.map((s) => s.id)), []);

  // AI-estimated eligibility for RAG-only schemes — see hooks/useSchemeEstimate.js
  // and components/EstimateBlock.js (shared with app/eligibility/page.js).
  const { estimates, runEstimate } = useSchemeEstimate(sessionId);

  // Browsing the FULL ingested corpus (scheme_documents — could be thousands of
  // rows once you've run scripts/ingest-schemes.js with a real dataset), separate
  // from the small local SCHEMES grid above and separate from search. Paginated
  // since this can be large. Only shown when there's no active search query — while
  // searching, the "More from search" section below already covers the corpus.
  const [browsePage, setBrowsePage] = useState(1);
  const [browseResults, setBrowseResults] = useState([]);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browseLoading, setBrowseLoading] = useState(false);
  const BROWSE_PAGE_SIZE = 24;

  const isSearching = query.trim().length >= 3;

  useEffect(() => {
    if (isSearching) return; // search results section covers the corpus while typing

    let cancelled = false;
    setBrowseLoading(true);

    fetch(`/api/schemes/browse?page=${browsePage}&pageSize=${BROWSE_PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setBrowseResults(data.results || []);
        setBrowseTotal(data.total || 0);
      })
      .catch((err) => console.error("Scheme browse failed:", err))
      .finally(() => !cancelled && setBrowseLoading(false));

    return () => { cancelled = true; };
  }, [browsePage, isSearching]);

  // Ingested rows that duplicate one of the local 30 (same scheme_id) are already
  // shown above with full eligibility-check/document links — no need to repeat them.
  const extraBrowseResults = useMemo(
    () => browseResults.filter((r) => !r.scheme_id || !localIds.has(r.scheme_id)),
    [browseResults, localIds]
  );

  const browseTotalPages = Math.max(1, Math.ceil(browseTotal / BROWSE_PAGE_SIZE));

  // RAG results whose scheme isn't already shown in the local grid above —
  // this is what search surfaces once you've ingested a corpus bigger than
  // the 30 schemes with structured eligibility rules. With just the bundled
  // seed corpus (which is those same 30 schemes) this list will usually be
  // empty — that's expected, not a bug; see RAG.md's "Scaling up" section.
  const extraRagResults = useMemo(
    () => ragResults.filter((r) => !r.schemeId || !localIds.has(r.schemeId)),
    [ragResults, localIds]
  );

  return (
    <div>
      <div className="page-header">
        <h1>Scheme Discovery</h1>
        <p>
          Browse {SCHEMES.length} schemes with detailed eligibility checks
          {browseTotal > SCHEMES.length ? `, plus ${browseTotal.toLocaleString()} more in the full scheme database below.` : "."}
        </p>
      </div>

      <input
        className="search-input"
        placeholder="Search by scheme name, benefit, or state..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="filter-row">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`filter-chip${category === c ? " active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c === "all" ? "All" : c.replace(/-/g, " ")}
          </button>
        ))}
      </div>

      <div className="scheme-cards-grid">
        {filtered.map((s) => {
          const isSaved   = savedIds.has(s.id);
          const isSaving  = savingId === s.id;

          return (
            <div key={s.id} className="scheme-card">
              <div className="scheme-card-top">
                <span className="scheme-icon">{SCHEME_ICON[s.category] || "📜"}</span>
                <div style={{ flex: 1 }}>
                  <div className="scheme-card-title">
                    {s.name}{" "}
                    <span
                      title="Backed by a deterministic rule engine, not model interpretation"
                      style={{ fontSize: "11px", fontWeight: 600, color: "#4ade80", border: "1px solid #4ade80", borderRadius: "999px", padding: "1px 8px", verticalAlign: "middle" }}
                    >
                      ✓ Verified
                    </span>
                  </div>
                  <div className="scheme-card-local">{s.nameLocal}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSave(s.id, isSaved)}
                  disabled={isSaving || !sessionId}
                  title={isSaved ? "Remove from saved schemes" : "Save this scheme"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: sessionId ? "pointer" : "default",
                    fontSize: "20px",
                    lineHeight: 1,
                    opacity: isSaving ? 0.5 : 1,
                    padding: "4px",
                  }}
                >
                  {isSaved ? "🔖" : "📑"}
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
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="icon">🔍</div>
            No schemes match your search.
          </div>
        )}
      </div>

      {!isSearching && (
        <div className="browse-corpus-section" style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "4px" }}>
            Full scheme database{browseLoading ? " …" : ""}
          </h2>
          <p style={{ color: "var(--text-secondary, #999)", fontSize: "13px", marginBottom: "16px" }}>
            {browseTotal > SCHEMES.length
              ? `${browseTotal.toLocaleString()} more schemes from the full corpus — shown with a preliminary AI-estimated eligibility read instead of the verified checker above.`
              : "Only the seed corpus is ingested so far — run node scripts/ingest-schemes.js with a bigger dataset (see RAG.md) to populate this with thousands more schemes."}
          </p>

          {!browseLoading && extraBrowseResults.length === 0 && (
            <div className="empty-state" style={{ opacity: 0.7 }}>
              Nothing here yet beyond the {SCHEMES.length} schemes above.
            </div>
          )}

          <div className="scheme-cards-grid">
            {extraBrowseResults.map((r) => {
              const ragId = r.scheme_id || slugifyTitle(r.title);
              const isRagSaved = savedIds.has(ragId);
              const isRagSaving = savingId === ragId;

              return (
              <div key={r.id} className="scheme-card">
                <div className="scheme-card-top">
                  <span className="scheme-icon">📜</span>
                  <div style={{ flex: 1 }}>
                    <div className="scheme-card-title">
                      {r.title}{" "}
                      <span
                        title="Not yet in our verified checker — eligibility here comes from a best-effort AI read of this scheme's own text, not a deterministic rule engine."
                        style={{ fontSize: "11px", fontWeight: 600, color: "#fbbf24", border: "1px solid #fbbf24", borderRadius: "999px", padding: "1px 8px", verticalAlign: "middle" }}
                      >
                        ◐ Preliminary
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSave(ragId, isRagSaved, { title: r.title, sourceUrl: r.source_url || null })}
                    disabled={isRagSaving || !sessionId}
                    title={isRagSaved ? "Remove from saved schemes" : "Save this scheme"}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", opacity: isRagSaving ? 0.5 : 1 }}
                  >
                    {isRagSaved ? "🔖" : "📑"}
                  </button>
                </div>
                <div className="scheme-card-desc">{(r.content || "").slice(0, 220)}{(r.content || "").length > 220 ? "…" : ""}</div>
                <div className="scheme-card-meta">
                  <span>{!r.state || r.state === "central" ? "Central Scheme" : r.state}</span>
                </div>
                <div className="result-actions">
                  <Link href="/ai-assistant" className="btn-link">Ask the assistant about this →</Link>
                  {r.source_url && (
                    <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="btn-link">
                      Official source →
                    </a>
                  )}
                </div>
                <div style={{ marginTop: "8px" }}>
                  <EstimateBlock title={r.title} content={r.content} estimate={estimates[r.title]} onRun={runEstimate} />
                </div>
              </div>
              );
            })}
          </div>

          {browseTotalPages > 1 && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", justifyContent: "center", marginTop: "20px" }}>
              <button
                type="button"
                className="filter-chip"
                disabled={browsePage <= 1 || browseLoading}
                onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <span style={{ fontSize: "13px", color: "var(--text-secondary, #999)" }}>
                Page {browsePage} of {browseTotalPages}
              </span>
              <button
                type="button"
                className="filter-chip"
                disabled={browsePage >= browseTotalPages || browseLoading}
                onClick={() => setBrowsePage((p) => Math.min(browseTotalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {isSearching && (
        <div className="rag-results-section" style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "4px" }}>
            More from search{ragLoading ? " …" : ""}
          </h2>
          <p style={{ color: "var(--text-secondary, #999)", fontSize: "13px", marginBottom: "16px" }}>
            {ragMode === "vector"
              ? "Semantic search across the full scheme database."
              : ragMode === "keyword-db"
              ? "Keyword search across the full scheme database — semantic search is temporarily unavailable."
              : "Keyword search — run node scripts/ingest-schemes.js with a real corpus for semantic search."}
          </p>

          {!ragLoading && extraRagResults.length === 0 && (
            <div className="empty-state" style={{ opacity: 0.7 }}>
              No additional schemes found in the database for this search.
            </div>
          )}

          <div className="scheme-cards-grid">
            {extraRagResults.map((r, i) => {
              const ragId = r.schemeId || slugifyTitle(r.title);
              const isRagSaved = savedIds.has(ragId);
              const isRagSaving = savingId === ragId;

              return (
              <div key={ragId || `${r.title}-${i}`} className="scheme-card">
                <div className="scheme-card-top">
                  <span className="scheme-icon">📜</span>
                  <div style={{ flex: 1 }}>
                    <div className="scheme-card-title">
                      {r.title}{" "}
                      <span
                        title="Not yet in our verified checker — eligibility here comes from a best-effort AI read of this scheme's own text, not a deterministic rule engine."
                        style={{ fontSize: "11px", fontWeight: 600, color: "#fbbf24", border: "1px solid #fbbf24", borderRadius: "999px", padding: "1px 8px", verticalAlign: "middle" }}
                      >
                        ◐ Preliminary
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSave(ragId, isRagSaved, { title: r.title, sourceUrl: r.sourceUrl || null })}
                    disabled={isRagSaving || !sessionId}
                    title={isRagSaved ? "Remove from saved schemes" : "Save this scheme"}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", opacity: isRagSaving ? 0.5 : 1 }}
                  >
                    {isRagSaved ? "🔖" : "📑"}
                  </button>
                </div>
                <div className="scheme-card-desc">{r.excerpt}</div>
                <div className="scheme-card-meta">
                  <span>{!r.state || r.state === "central" ? "Central Scheme" : r.state}</span>
                </div>
                <div className="result-actions">
                  <Link href="/ai-assistant" className="btn-link">Ask the assistant about this →</Link>
                  {r.sourceUrl && (
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-link">
                      Official source →
                    </a>
                  )}
                </div>
                <div style={{ marginTop: "8px" }}>
                  <EstimateBlock title={r.title} content={r.excerpt} estimate={estimates[r.title]} onRun={runEstimate} />
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}