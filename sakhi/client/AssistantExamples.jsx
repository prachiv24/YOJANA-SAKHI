// client/AssistantExamples.jsx
//
// Drop-in examples showing exactly where each assistant call plugs into
// your existing screens. Not meant to be used as one big component —
// copy the relevant snippet into your actual EligibilityResult / DocUpload
// / ApplyConfirmation components.

import { useEffect, useState } from "react";
import { useAssistant } from "./useAssistant";

/* ---------- 1. On the "why don't I qualify" screen ---------- */
export function EligibilityGapCard({ scheme, failedRules, profile }) {
  const { explainGap } = useAssistant();
  const [text, setText] = useState(null);

  useEffect(() => {
    if (failedRules.length > 0) {
      explainGap(scheme, failedRules, profile).then(setText);
    }
  }, [scheme, failedRules, profile, explainGap]);

  if (failedRules.length === 0) return null;

  return (
    <div className="gap-card">
      <h4>Why you don't qualify yet</h4>
      <p>{text || "Loading..."}</p>
    </div>
  );
}

/* ---------- 2. On document upload, when OCR confidence is low ---------- */
export function OcrFallbackPrompt({ documentName, expectedField, onAnswer }) {
  const { askOcrFallback, parseFallback } = useAssistant();
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    askOcrFallback(documentName, expectedField).then(setQuestion);
  }, [documentName, expectedField, askOcrFallback]);

  async function handleSubmit() {
    const parsed = await parseFallback(expectedField, "string", answer);
    onAnswer(parsed.confident ? parsed.value : answer); // graceful degrade either way
  }

  return (
    <div className="ocr-fallback">
      <p>{question || `Couldn't read this document — what's the ${expectedField}?`}</p>
      <input value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <button onClick={handleSubmit}>Continue</button>
    </div>
  );
}

/* ---------- 3. On the document checklist screen ---------- */
export function DocumentChecklist({ scheme, docsUserHas }) {
  const { getDocChecklist } = useAssistant();
  const [items, setItems] = useState(scheme.requiredDocuments.map((d) => ({ ...d, tip: "" })));

  useEffect(() => {
    getDocChecklist(scheme, docsUserHas).then((annotated) => {
      const byId = Object.fromEntries(annotated.map((a) => [a.id, a.tip]));
      const ordered = annotated
        .map((a) => scheme.requiredDocuments.find((d) => d.id === a.id))
        .filter(Boolean)
        .map((d) => ({ ...d, tip: byId[d.id] || "" }));
      setItems(ordered.length ? ordered : items);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheme, docsUserHas]);

  return (
    <ul className="doc-checklist">
      {items.map((doc) => (
        <li key={doc.id}>
          <strong>{doc.name}</strong>
          {!docsUserHas.includes(doc.id) && doc.tip && <p className="tip">{doc.tip}</p>}
        </li>
      ))}
    </ul>
  );
}

/* ---------- 3b. Right after OCR succeeds — verify doc matches the form ---------- */
export function DocumentVerificationCard({ documentName, extractedFields, formValues, fieldMap, onResolved }) {
  const { verifyDocument } = useAssistant();
  const [result, setResult] = useState(null);

  useEffect(() => {
    verifyDocument(documentName, extractedFields, formValues, fieldMap).then(setResult);
  }, [documentName, extractedFields, formValues, fieldMap, verifyDocument]);

  if (!result) return <p>Checking document against your form...</p>;

  if (result.matches) {
    // Nothing to show — let the upload flow proceed silently.
    onResolved?.(true);
    return null;
  }

  const hasCritical = result.mismatches.some((m) => m.severity === "critical");

  return (
    <div className={`verify-card ${hasCritical ? "critical" : "minor"}`}>
      <h4>{hasCritical ? "This document doesn't match your form" : "Small differences found"}</h4>
      <ul>
        {result.mismatches.map((m, i) => (
          <li key={i}>
            <strong>{m.field}:</strong> form says "{m.formValue}", document says "{m.documentValue}"
            <p className="note">{m.note}</p>
          </li>
        ))}
      </ul>
      {hasCritical ? (
        <>
          <p>Please check you've uploaded the right document, or correct the form field.</p>
          <button onClick={() => onResolved?.(false)}>Re-upload document</button>
        </>
      ) : (
        <button onClick={() => onResolved?.(true)}>Looks fine, continue anyway</button>
      )}
    </div>
  );
}

/* ---------- 4. On the "Applied!" confirmation screen ---------- */
export function NextStepsCard({ scheme }) {
  const { getNextSteps } = useAssistant();
  const [text, setText] = useState(null);

  useEffect(() => {
    getNextSteps(scheme).then(setText);
  }, [scheme, getNextSteps]);

  return (
    <div className="next-steps-card">
      <h4>What happens now</h4>
      <p>{text || "Loading..."}</p>
    </div>
  );
}