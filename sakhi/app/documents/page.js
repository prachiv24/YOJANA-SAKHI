"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "../../context/SessionContext";
import { SCHEMES } from "../../data/schemes.js";
import DocumentUpload from "../../components/DocumentUpload";

// useSearchParams() needs a Suspense boundary around it in the App Router,
// otherwise `next build` fails to prerender this page.
export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="empty-state"><div className="icon">⏳</div>Loading...</div>}>
      <DocumentsPageInner />
    </Suspense>
  );
}

function DocumentsPageInner() {
  const { sessionId } = useSession();
  const searchParams = useSearchParams();
  const requestedScheme = searchParams.get("scheme");
  const [schemeId, setSchemeId] = useState(
    (requestedScheme && SCHEMES.some((s) => s.id === requestedScheme)
      ? requestedScheme
      : SCHEMES[0]?.id) || ""
  );
  const [verifiedById, setVerifiedById] = useState({}); // { [documentId]: true }
  const [loadingStatus, setLoadingStatus] = useState(false);

  const scheme = SCHEMES.find((s) => s.id === schemeId);

  // Load previously-verified documents for this session + scheme so the
  // checklist doesn't reset to blank every time the page reloads.
  useEffect(() => {
    if (!sessionId || !schemeId) return;

    let cancelled = false;
    setLoadingStatus(true);

    fetch(`/api/documents?sessionId=${encodeURIComponent(sessionId)}&schemeId=${encodeURIComponent(schemeId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const map = {};
        for (const d of data.documents || []) {
          if (d.verified) map[d.document_id] = true;
        }
        setVerifiedById(map);
      })
      .catch((err) => console.error("Failed to load document status:", err))
      .finally(() => !cancelled && setLoadingStatus(false));

    return () => {
      cancelled = true;
    };
  }, [sessionId, schemeId]);

  const documentsWithStatus =
    scheme?.requiredDocuments.map((d) => ({
      ...d,
      verified: !!verifiedById[d.id],
    })) || [];

  const verifiedCount = documentsWithStatus.filter((d) => d.verified).length;

  function handleVerified(documentId) {
    setVerifiedById((prev) => ({ ...prev, [documentId]: true }));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Uploaded Documents</h1>
        <p>
          Pick a scheme below, then upload each required document. Yojana Sakhi AI
          scans and verifies it instantly.
        </p>
      </div>

      <div className="scheme-select-row">
        <select value={schemeId} onChange={(e) => setSchemeId(e.target.value)}>
          {SCHEMES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.state !== "central" ? `(${s.state})` : ""}
            </option>
          ))}
        </select>
        {scheme && (
          <span className="badge green">{verifiedCount}/{documentsWithStatus.length} verified</span>
        )}
      </div>

      {!sessionId || loadingStatus ? (
        <div className="empty-state">
          <div className="icon">⏳</div>
          Loading your document checklist...
        </div>
      ) : scheme ? (
        <DocumentUpload
          sessionId={sessionId}
          schemeId={scheme.id}
          schemeName={scheme.name}
          documents={documentsWithStatus}
          onVerified={handleVerified}
        />
      ) : (
        <div className="empty-state">
          <div className="icon">📎</div>
          Select a scheme above to see its required documents.
        </div>
      )}
    </div>
  );
}
