"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "../../context/SessionContext";
import { SCHEMES } from "../../data/schemes.js";
import { evaluateAllSchemes } from "../../lib/eligibility.js";
import { useSchemeEstimate } from "../../hooks/useSchemeEstimate.js";
import EstimateBlock from "../../components/EstimateBlock.js";

const EMPTY_PROFILE = {
  age: "",
  gender: "",
  maritalStatus: "",
  state: "",
  district: "",
  incomeAnnual: "",
  casteCategory: "",
  bplCard: false,
  aadhaarLinked: false,
  dependents: "",
  occupation: "",
  disability: false,
  landOwned: false,
};

const NUMBER_FIELDS = new Set(["age", "incomeAnnual", "dependents"]);
const CHECKBOX_FIELDS = new Set(["bplCard", "aadhaarLinked", "disability", "landOwned"]);

export default function EligibilityPage() {
  const { sessionId } = useSession();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Broader matches from the full RAG corpus (thousands of schemes, not just the
  // 30 with structured rules above) — searched once per submission using the
  // citizen's own profile as the query, then each result gets an on-demand
  // AI-estimated eligibility check via the same shared component Scheme
  // Discovery uses. Deliberately separate from `results` above: those are
  // verified/deterministic, these are AI-estimated — never merge the two lists.
  const [ragMatches, setRagMatches] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);
  const { estimates, runEstimate } = useSchemeEstimate(sessionId);

  // Prefill the form with whatever profile the chat agent has already
  // built up for this session (they share the same Supabase row).
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    fetch(`/api/profile?sessionId=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.profile) return;
        setProfile((prev) => ({ ...prev, ...data.profile }));
      })
      .catch((err) => console.error("Failed to load profile:", err))
      .finally(() => !cancelled && setLoadingProfile(false));

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  function updateField(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!sessionId) return;

    setSaving(true);

    // Coerce numeric fields, drop empty strings so evaluateEligibility's
    // comparators (which expect real numbers or true/false) work correctly.
    const cleaned = {};
    for (const [key, value] of Object.entries(profile)) {
      if (NUMBER_FIELDS.has(key)) {
        if (value !== "") cleaned[key] = Number(value);
      } else if (value !== "") {
        cleaned[key] = value;
      }
    }

    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...cleaned }),
      });
    } catch (err) {
      console.error("Failed to save profile:", err);
    }

    const evaluated = evaluateAllSchemes(cleaned, SCHEMES);
    setResults(evaluated);
    setSaving(false);

    // Broader search over the full corpus (thousands of schemes vs. these 30) —
    // build a plain-language query from whatever profile fields are filled in.
    const queryParts = [cleaned.occupation, cleaned.casteCategory, cleaned.gender, cleaned.disability ? "disability" : null, "welfare scheme", cleaned.state].filter(Boolean);

    if (queryParts.length) {
      setRagLoading(true);
      const localNames = new Set(SCHEMES.map((s) => s.name));

      try {
        const res = await fetch("/api/schemes/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryParts.join(" "), matchCount: 6, state: cleaned.state || null }),
        });
        const data = await res.json();
        // Skip anything that's actually one of the 30 already shown above with a verified result.
        setRagMatches((data.results || []).filter((r) => !localNames.has(r.title)));
      } catch (err) {
        console.error("Broader scheme search failed:", err);
        setRagMatches([]);
      } finally {
        setRagLoading(false);
      }
    } else {
      setRagMatches([]);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Eligibility Check</h1>
        <p>Fill in your details once — we&apos;ll check them against every scheme in the database.</p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="section-title">Your Profile</div>
        <div className="form-grid">
          <div className="field">
            <label>Age</label>
            <input
              type="number"
              min="0"
              value={profile.age}
              onChange={(e) => updateField("age", e.target.value)}
              placeholder="e.g. 45"
            />
          </div>

          <div className="field">
            <label>Gender</label>
            <select value={profile.gender} onChange={(e) => updateField("gender", e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="field">
            <label>Marital Status</label>
            <select
              value={profile.maritalStatus}
              onChange={(e) => updateField("maritalStatus", e.target.value)}
            >
              <option value="">Select</option>
              <option value="married">Married</option>
              <option value="widow">Widow</option>
              <option value="widower">Widower</option>
              <option value="divorced">Divorced</option>
              <option value="single">Single</option>
            </select>
          </div>

          <div className="field">
            <label>State</label>
            <input
              type="text"
              value={profile.state}
              onChange={(e) => updateField("state", e.target.value)}
              placeholder="e.g. Uttar Pradesh"
            />
          </div>

          <div className="field">
            <label>District</label>
            <input
              type="text"
              value={profile.district}
              onChange={(e) => updateField("district", e.target.value)}
              placeholder="e.g. Lucknow"
            />
          </div>

          <div className="field">
            <label>Annual Household Income (₹)</label>
            <input
              type="number"
              min="0"
              value={profile.incomeAnnual}
              onChange={(e) => updateField("incomeAnnual", e.target.value)}
              placeholder="e.g. 150000"
            />
          </div>

          <div className="field">
            <label>Caste Category</label>
            <select
              value={profile.casteCategory}
              onChange={(e) => updateField("casteCategory", e.target.value)}
            >
              <option value="">Select</option>
              <option value="general">General</option>
              <option value="obc">OBC</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
            </select>
          </div>

          <div className="field">
            <label>Occupation</label>
            <input
              type="text"
              value={profile.occupation}
              onChange={(e) => updateField("occupation", e.target.value)}
              placeholder="e.g. Farmer"
            />
          </div>

          <div className="field">
            <label>Number of Dependents</label>
            <input
              type="number"
              min="0"
              value={profile.dependents}
              onChange={(e) => updateField("dependents", e.target.value)}
            />
          </div>

          <div className="field checkbox-field">
            <input
              type="checkbox"
              checked={!!profile.bplCard}
              onChange={(e) => updateField("bplCard", e.target.checked)}
            />
            <label>Has BPL / SECC card</label>
          </div>

          <div className="field checkbox-field">
            <input
              type="checkbox"
              checked={!!profile.aadhaarLinked}
              onChange={(e) => updateField("aadhaarLinked", e.target.checked)}
            />
            <label>Aadhaar linked to bank</label>
          </div>

          <div className="field checkbox-field">
            <input
              type="checkbox"
              checked={!!profile.landOwned}
              onChange={(e) => updateField("landOwned", e.target.checked)}
            />
            <label>Owns land</label>
          </div>

          <div className="field checkbox-field">
            <input
              type="checkbox"
              checked={!!profile.disability}
              onChange={(e) => updateField("disability", e.target.checked)}
            />
            <label>Has a disability</label>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn-primary" disabled={saving || !sessionId}>
            {saving ? "Checking..." : "Check Eligibility"}
          </button>
        </div>
      </form>

      {results && (
        <div className="result-list">
          <div className="section-title" style={{ marginTop: 6 }}>Results</div>
          {results.map((r) => {
            const scheme = SCHEMES.find((s) => s.id === r.schemeKey);
            const pct = Math.round((r.matchedConditions / (r.totalConditions || 1)) * 100);

            return (
              <div key={r.schemeKey} className={`result-card ${r.eligible ? "eligible" : "partial"}`}>
                <div className="result-head">
                  <span className="result-name">{scheme?.name}</span>
                  <span className={`badge ${r.eligible ? "green" : "orange"}`}>
                    {r.eligible ? "Eligible" : "Partial match"}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
                  {scheme?.benefitAmount}
                </div>
                <div className="result-progress">
                  <div className="result-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                {r.gaps.length > 0 && (
                  <ul className="gap-list">
                    {r.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                )}
                <div className="result-actions">
                  <Link href={`/documents?scheme=${scheme?.id}`} className="btn-link">
                    Upload documents →
                  </Link>
                  {scheme?.applicationUrl && (
                    <a
                      href={scheme.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-link"
                    >
                      Apply on official portal ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results && (
        <div className="result-list" style={{ marginTop: 28 }}>
          <div className="section-title">
            More matches from the full scheme database{ragLoading ? " …" : ragMatches?.length ? ` (${ragMatches.length})` : ""}
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: -6, marginBottom: 10 }}>
            Searched across 3,000+ schemes based on your profile. These aren&apos;t run through the
            verified checker above — click a scheme for a preliminary, AI-estimated read instead.
          </p>

          {!ragLoading && ragMatches?.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>No additional matches found for this profile.</p>
          )}

          {ragMatches?.map((r) => (
            <div key={r.title} className="result-card">
              <div className="result-head">
                <span className="result-name">
                  {r.title}{" "}
                  <span
                    title="Not yet in our verified checker — eligibility here comes from a best-effort AI read of this scheme's own text, not a deterministic rule engine."
                    style={{ fontSize: "11px", fontWeight: 600, color: "#fbbf24", border: "1px solid #fbbf24", borderRadius: "999px", padding: "1px 8px", verticalAlign: "middle" }}
                  >
                    ◐ Preliminary
                  </span>
                </span>
                {r.state && <span className="badge" style={{ background: "rgba(255,255,255,0.08)" }}>{r.state}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-faint)", margin: "4px 0 8px" }}>
                {(r.excerpt || "").slice(0, 180)}{(r.excerpt || "").length > 180 ? "…" : ""}
              </div>
              <div className="result-actions" style={{ marginBottom: 6 }}>
                <Link href="/ai-assistant" className="btn-link">Ask the assistant about this →</Link>
                {r.sourceUrl && (
                  <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="btn-link">
                    Official source →
                  </a>
                )}
              </div>
              <EstimateBlock title={r.title} content={r.excerpt} estimate={estimates[r.title]} onRun={runEstimate} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
