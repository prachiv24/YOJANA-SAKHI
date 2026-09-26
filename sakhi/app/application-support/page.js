"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SCHEMES } from "../../data/schemes.js";
import { useSession } from "../../context/SessionContext";
import { findIdentityMismatches } from "../../lib/docIdentity.js";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function labelize(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function ApplicationSupportContent() {
  const { sessionId } = useSession();
  const searchParams  = useSearchParams();
  const schemeId      = searchParams.get("scheme");

  const scheme = SCHEMES.find((s) => s.id === schemeId);

  const [profile, setProfile]     = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [generating, setGenerating] = useState(false);
  const [identityAck, setIdentityAck] = useState(false);

  const loadData = useCallback(async () => {
    if (!sessionId || !schemeId) return;
    setLoading(true);
    setError("");

    try {
      const [profileRes, docsRes] = await Promise.all([
        fetch(`/api/profile?sessionId=${encodeURIComponent(sessionId)}`),
        fetch(`/api/documents?sessionId=${encodeURIComponent(sessionId)}&schemeId=${encodeURIComponent(schemeId)}`),
      ]);

      const profileData = await profileRes.json();
      const docsData     = await docsRes.json();

      if (!profileRes.ok) throw new Error(profileData.error || "Could not load profile");
      if (!docsRes.ok) throw new Error(docsData.error || "Could not load documents");

      setProfile(profileData?.profile ? profileData : { profile: profileData.profile || null });
      setDocuments(docsData.documents || []);
    } catch (err) {
      setError(err.message || "Could not load your details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, schemeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const verifiedDocs = documents.filter((d) => d.verified);
  const profileFields = profile?.profile || {};
  const hasProfile = profileFields && Object.keys(profileFields).length > 0;
  const identityWarnings = findIdentityMismatches(documents, profileFields);
  const hasIdentityWarnings = identityWarnings.length > 0;
  const readyToGenerate = hasProfile && verifiedDocs.length > 0 && (!hasIdentityWarnings || identityAck);

  async function handleGeneratePdf() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const marginX = 48;
      let y = 60;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Application Summary", marginX, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on ${formatDate(new Date().toISOString())}`, marginX, y + 14);
      doc.setTextColor(0);
      y += 40;

      if (hasIdentityWarnings) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(180, 40, 40);
        const warnLines = doc.splitTextToSize(
          "Note: Yojana Sakhi AI detected a name mismatch across the uploaded documents. Please verify all documents belong to the applicant before submitting.",
          480
        );
        doc.text(warnLines, marginX, y);
        y += 14 * warnLines.length + 10;
        doc.setTextColor(0);
      }

      // Scheme section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Scheme Details", marginX, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Scheme: ${scheme?.name || schemeId}`, marginX, y); y += 16;
      if (scheme?.nameLocal) { doc.text(`Local name: ${scheme.nameLocal}`, marginX, y); y += 16; }
      if (scheme?.state) { doc.text(`Applicable region: ${scheme.state === "central" ? "Central Scheme" : scheme.state}`, marginX, y); y += 16; }
      if (scheme?.benefitAmount) { doc.text(`Benefit: ${scheme.benefitAmount}`, marginX, y); y += 16; }
      y += 16;

      // Applicant details section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Applicant Details", marginX, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      for (const [key, value] of Object.entries(profileFields)) {
        if (value === null || value === undefined || value === "") continue;
        doc.text(`${labelize(key)}: ${String(value)}`, marginX, y);
        y += 16;
        if (y > 760) { doc.addPage(); y = 60; }
      }
      y += 16;

      // Verified documents section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Verified Documents", marginX, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      if (verifiedDocs.length === 0) {
        doc.text("No documents verified yet.", marginX, y);
        y += 16;
      } else {
        for (const d of verifiedDocs) {
          if (y > 740) { doc.addPage(); y = 60; }
          doc.setFont("helvetica", "bold");
          doc.text(`• ${d.doc_name || d.document_id}`, marginX, y);
          y += 15;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          const ocrLines = (d.ocr_text || "").split("\n").filter(Boolean);
          for (const line of ocrLines) {
            const wrapped = doc.splitTextToSize(line, 480);
            doc.text(wrapped, marginX + 14, y);
            y += 12 * wrapped.length;
            if (y > 760) { doc.addPage(); y = 60; }
          }
          doc.setFontSize(11);
          y += 8;
        }
      }

      y += 10;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        "This is an auto-generated application summary based on your verified profile and documents.",
        marginX, y > 780 ? (doc.addPage(), 60) : y, { maxWidth: 480 }
      );

      const fileName = `${(scheme?.name || schemeId || "application").replace(/\s+/g, "_")}_application.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Could not generate the PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Application Support</h1>
        <p>We'll assemble your application using the details you've already verified.</p>
      </div>

      {!schemeId && (
        <div className="placeholder-card">
          <div className="icon">📋</div>
          <h2>No scheme selected</h2>
          <p>Please open this page from a scheme's document upload flow.</p>
        </div>
      )}

      {schemeId && !sessionId && (
        <div className="placeholder-card">
          <div className="icon">📋</div>
          <h2>No active session found</h2>
          <p>Please start from your profile or a scheme page first.</p>
        </div>
      )}

      {schemeId && sessionId && loading && (
        <div className="placeholder-card">
          <div className="icon">⏳</div>
          <h2>Loading your details...</h2>
        </div>
      )}

      {schemeId && sessionId && !loading && error && (
        <div className="placeholder-card">
          <div className="icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
        </div>
      )}

      {schemeId && sessionId && !loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Scheme card */}
          <div className="scheme-card">
            <div className="scheme-card-title">{scheme?.name || schemeId}</div>
            {scheme?.nameLocal && <div className="scheme-card-local">{scheme.nameLocal}</div>}
            {scheme?.benefitAmount && (
              <div className="scheme-card-meta" style={{ marginTop: "8px" }}>
                <span className="scheme-card-benefit">{scheme.benefitAmount}</span>
              </div>
            )}
          </div>

          {/* Profile summary */}
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "20px", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ fontWeight: 600, marginBottom: "10px" }}>👤 Applicant Details</div>
            {hasProfile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", opacity: 0.9 }}>
                {Object.entries(profileFields).map(([key, value]) => (
                  value !== null && value !== undefined && value !== "" && (
                    <div key={key}>
                      <strong>{labelize(key)}:</strong> {String(value)}
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p style={{ opacity: 0.7, fontSize: "14px" }}>No profile saved yet. Please complete your profile first.</p>
            )}
          </div>

          {/* Cross-document identity check */}
          {hasIdentityWarnings && (
            <div
              style={{
                border: "1px solid rgba(224, 87, 74, 0.4)",
                background: "rgba(224, 87, 74, 0.1)",
                borderRadius: "12px",
                padding: "16px 18px",
              }}
            >
              <div style={{ fontWeight: 700, color: "#fca5a5", marginBottom: "6px" }}>
                ⚠️ These documents may not all belong to the same person
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "10px" }}>
                Yojana Sakhi AI compared the name on each verified document and found a mismatch.
                Double-check you uploaded your own documents before applying — a wrong document
                will likely get your application rejected.
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#fca5a5" }}>
                {identityWarnings.map((w) => (
                  <li key={w.documentId} style={{ marginBottom: "3px" }}>
                    <strong>{w.docName}</strong> says &quot;{w.extractedName}&quot;, but other
                    documents / your profile say &quot;{w.expectedName}&quot;.
                  </li>
                ))}
              </ul>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "12px",
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={identityAck}
                  onChange={(e) => setIdentityAck(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--purple)" }}
                />
                I've checked — these documents are mine, and I still want to continue.
              </label>
            </div>
          )}

          {/* Documents summary */}
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "20px", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ fontWeight: 600, marginBottom: "10px" }}>
              📄 Verified Documents ({verifiedDocs.length}/{documents.length || 0})
            </div>
            {verifiedDocs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {verifiedDocs.map((d) => {
                  const conflict = identityWarnings.find((w) => w.documentId === d.document_id);
                  return (
                    <div key={d.document_id} style={{ fontSize: "14px" }}>
                      <div style={{ fontWeight: 600 }}>
                        {conflict ? "⚠️" : "✅"} {d.doc_name || d.document_id}
                        {conflict && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#fca5a5",
                              border: "1px solid rgba(239,68,68,0.4)",
                              borderRadius: "999px",
                              padding: "1px 8px",
                            }}
                          >
                            Name mismatch
                          </span>
                        )}
                      </div>
                      {d.ocr_text && (
                        <div style={{ opacity: 0.6, fontSize: "12.5px", marginTop: "2px" }}>{d.ocr_text}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ opacity: 0.7, fontSize: "14px" }}>No documents verified yet. Please upload and verify your documents first.</p>
            )}
          </div>

          {/* Generate button */}
          <button
            className="doc-apply-btn"
            onClick={handleGeneratePdf}
            disabled={!readyToGenerate || generating}
            style={{ alignSelf: "flex-start" }}
          >
            {generating ? "Generating PDF..." : "📥 Download Pre-Filled Application PDF"}
          </button>

          {!readyToGenerate && (
            <p style={{ fontSize: "13px", opacity: 0.6 }}>
              {hasIdentityWarnings
                ? "Please review the name mismatch above and confirm before generating your PDF."
                : "Complete your profile and verify at least one document to generate your application PDF."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="placeholder-card"><div className="icon">⏳</div><h2>Loading...</h2></div>}>
      <ApplicationSupportContent />
    </Suspense>
  );
}