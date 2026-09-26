// components/EstimateBlock.js
//
// Renders the "Check eligibility (Preliminary estimate)" button / loading / result states
// for a RAG-only scheme (one that has no structured rules in data/schemes.js). Shared by
// app/scheme-discovery/page.js and app/eligibility/page.js — see lib/estimateEligibility.js
// for why this is deliberately styled and labeled differently from the deterministic
// "✓ Verified" results the local 30 schemes get. "Preliminary" (not "AI estimate") is the
// deliberate framing: it reads as an intentional tier of confidence, not an apology for an
// unfinished feature.

const VERDICT_LABEL = {
  eligible: { text: "Likely eligible", color: "#4ade80" },
  not_eligible: { text: "Likely not eligible", color: "#f87171" },
  uncertain: { text: "Uncertain", color: "#fbbf24" },
};

export default function EstimateBlock({ title, content, estimate, onRun }) {
  if (!estimate) {
    return (
      <button
        type="button"
        className="btn-link"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        onClick={() => onRun(title, content)}
        title="This scheme isn't in our verified checker yet. This gives a best-effort read from the scheme's own text using AI — always confirm with the department before relying on it."
      >
        Check eligibility (Preliminary estimate) →
      </button>
    );
  }

  if (estimate.loading) {
    return <span style={{ fontSize: "13px", color: "var(--text-secondary, #999)" }}>Estimating…</span>;
  }

  if (estimate.error) {
    return (
      <div>
        <span style={{ fontSize: "13px", color: "#f87171" }}>{estimate.error}</span>{" "}
        <button
          type="button"
          className="btn-link"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onClick={() => onRun(title, content)}
        >
          Retry
        </button>
      </div>
    );
  }

  const { verdict, confidence, reasoning, requiredDocuments } = estimate.result;
  const label = VERDICT_LABEL[verdict] ?? VERDICT_LABEL.uncertain;

  return (
    <div style={{ fontSize: "13px", marginTop: "6px", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ color: label.color, fontWeight: 600 }}>{label.text}</span>
        <span style={{ color: "var(--text-secondary, #999)" }}>{confidence}% confidence</span>
      </div>
      {reasoning && <p style={{ margin: "0 0 6px", color: "var(--text-secondary, #ccc)" }}>{reasoning}</p>}
      {requiredDocuments?.length > 0 && (
        <p style={{ margin: 0, color: "var(--text-secondary, #999)" }}>
          Typically needs: {requiredDocuments.join(", ")}
        </p>
      )}
      <p style={{ margin: "6px 0 0", fontSize: "11px", opacity: 0.6 }}>
        Preliminary estimate, not verified — read from your saved profile and this scheme's own text using AI. Confirm with the department before applying.
      </p>
    </div>
  );
}
