// // // components/DocumentUpload.js
// // // Drop this component into your page wherever you want to show the doc checklist.
// // // Usage: <DocumentUpload sessionId={sessionId} schemeId="up-widow-pension" schemeName="UP Widow Pension" documents={[...]} onVerified={fn} />

// // "use client";

// // import { useState, useRef, useEffect } from "react";
// // import { useRouter } from "next/navigation";
// // import { useAssistant } from "../client/useAssistant";
// // import { DOC_FIELD_MAP, findAgeMismatch } from "../lib/docIdentity.js";

// // const STATUS_ICON = {
// //   idle:       "📄",
// //   uploading:  "⏳",
// //   verified:   "✅",
// //   failed:     "❌",
// // };

// // function normalizeProfile(profile) {
// //   if (!profile) return null;
// //   const pick = (...candidates) => candidates.map((k) => profile[k]).find((v) => v !== undefined && v !== null);
// //   return {
// //     name:         pick("name", "fullName", "full_name"),
// //     dob:          pick("dob", "dateOfBirth", "date_of_birth"),
// //     incomeAnnual: pick("incomeAnnual", "income_annual", "annualIncome"),
// //     age:          pick("age"),
// //   };
// // }

// // export default function DocumentUpload({ sessionId, schemeId, schemeName, documents, onVerified }) {
// //   const router = useRouter();
// //   const { verifyDocument } = useAssistant();

// //   const [profile, setProfile] = useState(null);

// //   useEffect(() => {
// //     if (!sessionId) return;
// //     let cancelled = false;
// //     fetch(`/api/profile?sessionId=${encodeURIComponent(sessionId)}`)
// //       .then((res) => res.json())
// //       .then((data) => {
// //         if (!cancelled) setProfile(normalizeProfile(data.profile));
// //       })
// //       .catch((err) => console.error("Failed to load citizen profile:", err));
// //     return () => { cancelled = true; };
// //   }, [sessionId]);

// //   // Track per-document upload state
// //   const [docState, setDocState] = useState(
// //     Object.fromEntries(
// //       (documents || []).map((d) => [
// //         d.id,
// //         { status: d.verified ? "verified" : "idle", message: d.verified ? "Already verified" : "", preview: "", crossCheck: null },
// //       ])
// //     )
// //   );

// //   // Apply/submission state: "idle" | "submitting" | "success" | "failed"
// //   const [applyState, setApplyState] = useState("idle");
// //   const [applyError, setApplyError] = useState("");

// //   const inputRefs = useRef({});

// //   useEffect(() => {
// //     setDocState((prev) => {
// //       const next = { ...prev };
// //       for (const d of documents || []) {
// //         const current = next[d.id];
// //         if (d.verified && current?.status !== "verified") {
// //           next[d.id] = { status: "verified", message: current?.message || "Already verified", preview: current?.preview || "" };
// //         } else if (!next[d.id]) {
// //           next[d.id] = { status: "idle", message: "", preview: "" };
// //         }
// //       }
// //       return next;
// //     });
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [JSON.stringify((documents || []).map((d) => [d.id, d.verified]))]);

// //   function setDoc(docId, patch) {
// //     setDocState((prev) => ({ ...prev, [docId]: { ...prev[docId], ...patch } }));
// //   }

// //   async function handleFile(doc, file) {
// //     if (!file) return;

// //     if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
// //       setDoc(doc.id, { status: "failed", message: "Only images (JPG, PNG) or PDF allowed." });
// //       return;
// //     }

// //     if (file.size > 5 * 1024 * 1024) {
// //       setDoc(doc.id, { status: "failed", message: "File too large. Max 5MB." });
// //       return;
// //     }

// //     setDoc(doc.id, { status: "uploading", message: "Reading document..." });

// //     const form = new FormData();
// //     form.append("file",       file);
// //     form.append("sessionId",  sessionId);
// //     form.append("schemeId",   schemeId);
// //     form.append("documentId", doc.id);
// //     form.append("docName",    doc.name);

// //     try {
// //       const res  = await fetch("/api/ocr", { method: "POST", body: form });
// //       const data = await res.json();

// //       if (!res.ok) throw new Error(data.error || "Upload failed");

// //       setDoc(doc.id, {
// //         status:  data.verified ? "verified" : "failed",
// //         message: data.message,
// //         preview: data.extractedInfo || data.ocrPreview || "",
// //       });

// //       if (data.verified && onVerified) {
// //         onVerified(doc.id);
// //       }

// //       // Cross-check extracted fields against the profile
// //       const fieldMap = DOC_FIELD_MAP[doc.id];
// //       if (data.verified && fieldMap && profile) {
// //         try {
// //           const result = await verifyDocument(doc.name, data.fields || {}, profile, fieldMap);

// //           if (fieldMap.dob) {
// //             const ageMismatch = findAgeMismatch(profile.age, data.fields?.[fieldMap.dob]);
// //             if (ageMismatch) {
// //               result.matches = false;
// //               result.mismatches = [...(result.mismatches || []), ageMismatch];
// //             }
// //           }

// //           setDoc(doc.id, { crossCheck: result });
// //         } catch (err) {
// //           console.error("Document cross-check failed:", err);
// //         }
// //       }
// //     } catch (err) {
// //       setDoc(doc.id, {
// //         status:  "failed",
// //         message: "Upload failed. Please try again.",
// //       });
// //       console.error(err);
// //     }
// //   }

// //   async function handleApply() {
// //     setApplyState("submitting");
// //     setApplyError("");

// //     try {
// //       const res = await fetch("/api/applications", {
// //         method:  "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body:    JSON.stringify({ sessionId, schemeId, schemeName }),
// //       });
// //       const data = await res.json();

// //       if (!res.ok) throw new Error(data.error || "Application failed");

// //       setApplyState("success");

// //       setTimeout(() => {
// //         router.push("/track-applications");
// //       }, 1500);
// //     } catch (err) {
// //       setApplyState("failed");
// //       setApplyError(err.message || "Could not submit application. Please try again.");
// //       console.error(err);
// //     }
// //   }

// //   if (!documents || documents.length === 0) return null;

// //   const verifiedCount = Object.values(docState).filter((s) => s.status === "verified").length;
// //   const totalCount    = documents.length;
// //   const pct           = Math.round((verifiedCount / totalCount) * 100);
// //   const allVerified   = verifiedCount === totalCount && totalCount > 0;

// //   const hasCriticalMismatch = Object.values(docState).some((s) =>
// //     s.crossCheck && !s.crossCheck.matches && s.crossCheck.mismatches?.some((m) => m.severity === "critical")
// //   );
// //   const readyToApply = allVerified && !hasCriticalMismatch;

// //   return (
// //     <div className="doc-upload-panel">

// //       {/* Header */}
// //       <div className="doc-panel-header">
// //         <div className="doc-panel-title">📋 Required Documents</div>
// //         <div className="doc-panel-progress">
// //           <div className="doc-progress-bar">
// //             <div className="doc-progress-fill" style={{ width: `${pct}%` }} />
// //           </div>
// //           <span className="doc-progress-label">{verifiedCount}/{totalCount} verified</span>
// //         </div>
// //       </div>

// //       {/* Document rows */}
// //       <div className="doc-list">
// //         {documents.map((doc) => {
// //           const state = docState[doc.id] || { status: "idle", message: "", preview: "" };
// //           const isUploading = state.status === "uploading";

// //           return (
// //             <div key={doc.id} className={`doc-row doc-row-${state.status}`}>

// //               <div className="doc-row-left">
// //                 <span className="doc-status-icon">{STATUS_ICON[state.status]}</span>
// //                 <div className="doc-info">
// //                   <div className="doc-name">{doc.name}</div>
// //                   <div className="doc-desc">{doc.description}</div>
// //                   {state.message && (
// //                     <div className={`doc-message ${state.status === "verified" ? "doc-msg-ok" : "doc-msg-err"}`}>
// //                       {state.message}
// //                     </div>
// //                   )}
// //                   {state.preview && state.status === "verified" && (
// //                     <div className="doc-preview">
// //                       <span className="doc-preview-label">Extracted:</span>
// //                       <span className="doc-preview-text">{state.preview}</span>
// //                     </div>
// //                   )}
// //                   {state.crossCheck && !state.crossCheck.matches && (
// //                     <div className={`doc-crosscheck ${state.crossCheck.mismatches.some((m) => m.severity === "critical") ? "doc-crosscheck-critical" : "doc-crosscheck-minor"}`}>
// //                       {state.crossCheck.mismatches.map((m, i) => (
// //                         <div key={i}>⚠️ {m.field}: form says "{m.formValue}", document says "{m.documentValue}" — {m.note}</div>
// //                       ))}
// //                     </div>
// //                   )}
// //                 </div>
// //               </div>

// //               <div className="doc-row-right">
// //                 {state.status !== "verified" && (
// //                   <>
// //                     <input
// //                       type="file"
// //                       accept="image/*,.pdf"
// //                       ref={(el) => (inputRefs.current[doc.id] = el)}
// //                       style={{ display: "none" }}
// //                       onChange={(e) => handleFile(doc, e.target.files[0])}
// //                     />
// //                     <button
// //                       className="doc-upload-btn"
// //                       disabled={isUploading}
// //                       onClick={() => inputRefs.current[doc.id]?.click()}
// //                     >
// //                       {isUploading ? "Scanning..." : "Upload"}
// //                     </button>
// //                   </>
// //                 )}
// //                 {state.status === "verified" && (
// //                   <span className="doc-verified-badge">Verified ✓</span>
// //                 )}
// //               </div>

// //             </div>
// //           );
// //         })}
// //       </div>

// //       {/* Mismatch banner */}
// //       {allVerified && hasCriticalMismatch && (
// //         <div className="doc-complete-section">
// //           <div className="doc-crosscheck doc-crosscheck-critical">
// //             ⚠️ We found a mismatch between your form details and an uploaded document (see above). Please fix this before applying — the details above show what doesn't match.
// //           </div>
// //         </div>
// //       )}

// //       {/* All done banner + Apply button */}
// //       {readyToApply && (
// //         <div className="doc-complete-section">
// //           {applyState !== "success" && (
// //             <div className="doc-complete-banner">
// //               🎉 Sabhi documents verify ho gaye! Aap apply karne ke liye taiyaar hain.
// //             </div>
// //           )}

// //           {applyState === "success" && (
// //             <div className="doc-complete-banner doc-apply-success">
// //               ✅ Application submitted successfully! Redirecting to Track Applications...
// //             </div>
// //           )}

// //           {applyState === "failed" && (
// //             <div className="doc-apply-error">{applyError}</div>
// //           )}

// //           {applyState !== "success" && (
// //             <button
// //               className="doc-apply-btn"
// //               onClick={handleApply}
// //               disabled={applyState === "submitting"}
// //             >
// //               {applyState === "submitting" ? "Submitting..." : "Apply Now →"}
// //             </button>
// //           )}

// //           {applyState !== "success" && (
// //             <a
// //               href={`/application-support?scheme=${schemeId}`}
// //               className="btn-link"
// //               style={{ marginLeft: "12px" }}
// //             >
// //               📥 Get pre-filled application PDF →
// //             </a>
// //           )}
// //         </div>
// //       )}

// //     </div>
// //   );
// // }

// // components/DocumentUpload.js
// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAssistant } from "../client/useAssistant";
// import { DOC_FIELD_MAP, findAgeMismatch } from "../lib/docIdentity.js";

// const STATUS_ICON = {
//   idle:       "📄",
//   uploading:  "⏳",
//   verified:   "✅",
//   failed:     "❌",
// };

// async function compressImage(file) {
//   if (file.type === "application/pdf") return file;

//   return new Promise((resolve) => {
//     const img = new Image();
//     img.src = URL.createObjectURL(file);
//     img.onload = () => {
//       URL.revokeObjectURL(img.src);
//       const canvas = document.createElement("canvas");
//       const MAX_WIDTH = 1200;
//       const scaleSize = MAX_WIDTH / img.width;

//       if (scaleSize < 1) {
//         canvas.width = MAX_WIDTH;
//         canvas.height = img.height * scaleSize;
//       } else {
//         canvas.width = img.width;
//         canvas.height = img.height;
//       }

//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

//       canvas.toBlob(
//         (blob) => {
//           if (!blob) {
//             resolve(file);
//             return;
//           }
//           resolve(new File([blob], file.name, { type: "image/jpeg" }));
//         },
//         "image/jpeg",
//         0.8
//       );
//     };
//     img.onerror = () => resolve(file);
//   });
// }

// function normalizeProfile(profile) {
//   if (!profile) return null;
//   const pick = (...candidates) => candidates.map((k) => profile[k]).find((v) => v !== undefined && v !== null);
//   return {
//     name:         pick("name", "fullName", "full_name"),
//     dob:          pick("dob", "dateOfBirth", "date_of_birth"),
//     incomeAnnual: pick("incomeAnnual", "income_annual", "annualIncome"),
//     age:          pick("age"),
//   };
// }

// export default function DocumentUpload({ sessionId, schemeId, schemeName, documents, onVerified }) {
//   const router = useRouter();
//   const { verifyDocument } = useAssistant();

//   const [profile, setProfile] = useState(null);
//   const inputRefs = useRef({});

//   useEffect(() => {
//     if (!sessionId) return;
//     let cancelled = false;
//     fetch(`/api/profile?sessionId=${encodeURIComponent(sessionId)}`)
//       .then((res) => res.json())
//       .then((data) => {
//         if (!cancelled) setProfile(normalizeProfile(data.profile));
//       })
//       .catch((err) => console.error("Failed to load citizen profile:", err));
//     return () => { cancelled = true; };
//   }, [sessionId]);

//   const [docState, setDocState] = useState(
//     Object.fromEntries(
//       (documents || []).map((d) => [
//         d.id,
//         {
//           status: d.verified ? "verified" : "idle",
//           message: d.verified ? "Already verified" : "",
//           preview: d.ocr_text || "",
//           crossCheck: null,
//           fields: d.fields || {},
//         },
//       ])
//     )
//   );

//   const [applyState, setApplyState] = useState("idle");
//   const [applyError, setApplyError] = useState("");

//   // Sync state & perform cross-check on stored/hydrated documents
//   useEffect(() => {
//     setDocState((prev) => {
//       const next = { ...prev };
//       for (const d of documents || []) {
//         const current = next[d.id];
//         if (d.verified && current?.status !== "verified" && current?.status !== "failed") {
//           next[d.id] = {
//             status: "verified",
//             message: current?.message || "Already verified",
//             preview: d.ocr_text || current?.preview || "",
//             fields: d.fields || current?.fields || {},
//             crossCheck: current?.crossCheck || null,
//           };
//         } else if (!next[d.id]) {
//           next[d.id] = { status: "idle", message: "", preview: "", fields: {}, crossCheck: null };
//         }
//       }
//       return next;
//     });
//   }, [JSON.stringify((documents || []).map((d) => [d.id, d.verified, d.ocr_text]))]);

//   // Evaluate cross-check rules on mount/update and override status if a mismatch exists
//   useEffect(() => {
//     if (!profile) return;

//     (documents || []).forEach(async (doc) => {
//       const fieldMap = DOC_FIELD_MAP[doc.id];
//       const state = docState[doc.id];

//       if (fieldMap && (state?.status === "verified" || state?.status === "idle")) {
//         try {
//           const fields = state?.fields || {};
//           const result = await verifyDocument(doc.name, fields, profile, fieldMap);

//           if (fieldMap.dob) {
//             const ageMismatch = findAgeMismatch(profile.age, fields?.[fieldMap.dob]);
//             if (ageMismatch) {
//               result.matches = false;
//               result.mismatches = [...(result.mismatches || []), ageMismatch];
//             }
//           }

//           const hasCritical = result && !result.matches && result.mismatches?.some((m) => m.severity === "critical");

//           setDocState((prev) => ({
//             ...prev,
//             [doc.id]: {
//               ...prev[doc.id],
//               status: hasCritical ? "failed" : prev[doc.id]?.status,
//               message: hasCritical ? "❌ Profile mismatch detected. Please re-upload a correct document." : prev[doc.id]?.message,
//               crossCheck: result,
//             },
//           }));
//         } catch (err) {
//           console.error("Cross-check evaluation failed:", err);
//         }
//       }
//     });
//   }, [profile]);

//   function setDoc(docId, patch) {
//     setDocState((prev) => ({ ...prev, [docId]: { ...prev[docId], ...patch } }));
//   }

//   async function handleFile(doc, file) {
//     if (!file) return;

//     if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
//       setDoc(doc.id, { status: "failed", message: "Only images (JPG, PNG) or PDF allowed." });
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       setDoc(doc.id, { status: "failed", message: "File too large. Max 10MB." });
//       return;
//     }

//     setDoc(doc.id, { status: "uploading", message: "Processing & verifying document..." });

//     try {
//       const processedFile = await compressImage(file);

//       const form = new FormData();
//       form.append("file",       processedFile);
//       form.append("sessionId",  sessionId);
//       form.append("schemeId",   schemeId);
//       form.append("documentId", doc.id);
//       form.append("docName",    doc.name);

//       const res  = await fetch("/api/ocr", { method: "POST", body: form });
//       const data = await res.json();

//       if (!res.ok) throw new Error(data.error || "Document processing failed");

//       const fields = data.fields || {};

//       let crossCheckResult = null;
//       const fieldMap = DOC_FIELD_MAP[doc.id];
//       if (data.verified && fieldMap && profile) {
//         try {
//           crossCheckResult = await verifyDocument(doc.name, fields, profile, fieldMap);

//           if (fieldMap.dob) {
//             const ageMismatch = findAgeMismatch(profile.age, fields?.[fieldMap.dob]);
//             if (ageMismatch) {
//               crossCheckResult.matches = false;
//               crossCheckResult.mismatches = [...(crossCheckResult.mismatches || []), ageMismatch];
//             }
//           }
//         } catch (err) {
//           console.error("Document cross-check failed:", err);
//         }
//       }

//       const hasCriticalMismatch =
//         crossCheckResult &&
//         !crossCheckResult.matches &&
//         crossCheckResult.mismatches?.some((m) => m.severity === "critical");

//       const finalVerified = data.verified && !hasCriticalMismatch;

//       setDoc(doc.id, {
//         status:     finalVerified ? "verified" : "failed",
//         message:    finalVerified
//                       ? `✅ ${doc.name} verified successfully!`
//                       : hasCriticalMismatch
//                       ? "❌ Document details do not match your profile. Please re-upload the correct document."
//                       : data.message || "Document verification failed.",
//         preview:    data.extractedInfo || "",
//         fields:     fields,
//         crossCheck: crossCheckResult,
//       });

//       if (finalVerified && onVerified) {
//         onVerified(doc.id);
//       }
//     } catch (err) {
//       setDoc(doc.id, {
//         status:  "failed",
//         message: err.message || "Upload failed. Please try again.",
//       });
//       console.error(err);
//     }
//   }

//   async function handleApply() {
//     setApplyState("submitting");
//     setApplyError("");

//     try {
//       const res = await fetch("/api/applications", {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify({ sessionId, schemeId, schemeName }),
//       });
//       const data = await res.json();

//       if (!res.ok) throw new Error(data.error || "Application failed");

//       setApplyState("success");

//       setTimeout(() => {
//         router.push("/track-applications");
//       }, 1500);
//     } catch (err) {
//       setApplyState("failed");
//       setApplyError(err.message || "Could not submit application. Please try again.");
//       console.error(err);
//     }
//   }

//   if (!documents || documents.length === 0) return null;

//   const verifiedCount = Object.values(docState).filter((s) => s.status === "verified").length;
//   const totalCount    = documents.length;
//   const pct           = Math.round((verifiedCount / totalCount) * 100);

//   const hasCriticalMismatch = Object.values(docState).some((s) =>
//     s.crossCheck && !s.crossCheck.matches && s.crossCheck.mismatches?.some((m) => m.severity === "critical")
//   );

//   const readyToApply = verifiedCount === totalCount && totalCount > 0 && !hasCriticalMismatch;

//   return (
//     <div className="doc-upload-panel">
//       <div className="doc-panel-header">
//         <div className="doc-panel-title">📋 Required Documents</div>
//         <div className="doc-panel-progress">
//           <div className="doc-progress-bar">
//             <div className="doc-progress-fill" style={{ width: `${pct}%` }} />
//           </div>
//           <span className="doc-progress-label">{verifiedCount}/{totalCount} verified</span>
//         </div>
//       </div>

//       <div className="doc-list">
//         {documents.map((doc) => {
//           const state = docState[doc.id] || { status: "idle", message: "", preview: "" };
//           const isUploading = state.status === "uploading";

//           return (
//             <div key={doc.id} className={`doc-row doc-row-${state.status}`}>
//               <div className="doc-row-left">
//                 <span className="doc-status-icon">{STATUS_ICON[state.status]}</span>
//                 <div className="doc-info">
//                   <div className="doc-name">{doc.name}</div>
//                   <div className="doc-desc">{doc.description}</div>

//                   {state.message && (
//                     <div className={`doc-message ${state.status === "verified" ? "doc-msg-ok" : "doc-msg-err"}`}>
//                       {state.message}
//                     </div>
//                   )}

//                   {state.preview && state.status === "verified" && (
//                     <div className="doc-preview">
//                       <span className="doc-preview-label">Extracted:</span>
//                       <span className="doc-preview-text">{state.preview}</span>
//                     </div>
//                   )}

//                   {state.crossCheck && !state.crossCheck.matches && (
//                     <div className="doc-crosscheck doc-crosscheck-critical" style={{ marginTop: "6px", color: "#f87171" }}>
//                       {state.crossCheck.mismatches.map((m, i) => (
//                         <div key={i}>⚠️ {m.field}: form says "{m.formValue}", document says "{m.documentValue}" — {m.note}</div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="doc-row-right">
//                 <input
//                   type="file"
//                   accept="image/*,.pdf"
//                   ref={(el) => (inputRefs.current[doc.id] = el)}
//                   style={{ display: "none" }}
//                   onChange={(e) => handleFile(doc, e.target.files[0])}
//                 />

//                 <button
//                   className="doc-upload-btn"
//                   disabled={isUploading}
//                   onClick={() => inputRefs.current[doc.id]?.click()}
//                 >
//                   {isUploading ? "Scanning..." : state.status === "verified" ? "Re-upload" : "Upload Document"}
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {hasCriticalMismatch && (
//         <div className="doc-complete-section" style={{ marginTop: "16px" }}>
//           <div className="doc-crosscheck doc-crosscheck-critical" style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#f87171" }}>
//             ⚠️ We found a mismatch between your form details and an uploaded document. Please re-upload the correct document to proceed.
//           </div>
//         </div>
//       )}

//       {readyToApply && (
//         <div className="doc-complete-section">
//           {applyState !== "success" && (
//             <div className="doc-complete-banner">
//               🎉 Sabhi documents verify ho gaye! Aap apply karne ke liye taiyaar hain.
//             </div>
//           )}

//           {applyState === "success" && (
//             <div className="doc-complete-banner doc-apply-success">
//               ✅ Application submitted successfully! Redirecting to Track Applications...
//             </div>
//           )}

//           {applyState === "failed" && (
//             <div className="doc-apply-error">{applyError}</div>
//           )}

//           {applyState !== "success" && (
//             <button
//               className="doc-apply-btn"
//               onClick={handleApply}
//               disabled={applyState === "submitting"}
//             >
//               {applyState === "submitting" ? "Submitting..." : "Apply Now →"}
//             </button>
//           )}

//           {applyState !== "success" && (
//             <a
//               href={`/application-support?scheme=${schemeId}`}
//               className="btn-link"
//               style={{ marginLeft: "12px" }}
//             >
//               📥 Get pre-filled application PDF →
//             </a>
//           )}
//         </div>
//       )}
//     </div>
//   );




import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAssistant } from "../client/useAssistant";
import { DOC_FIELD_MAP, findAgeMismatch } from "../lib/docIdentity.js";

const STATUS_ICON = {
  idle:       "📄",
  uploading:  "⏳",
  verified:   "✅",
  failed:     "❌",
};

// Drop placeholder "couldn't verify" entries so they never show up as red mismatches
function cleanCrossCheck(result) {
  if (!result) return result;
  const real = (result.mismatches || []).filter(
    (m) => m.field && m.field !== "unknown" && (m.formValue || m.documentValue)
  );
  return { ...result, mismatches: real, matches: real.length === 0 };
}

async function compressImage(file) {
  if (file.type === "application/pdf") return file;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 1200;
      const scaleSize = MAX_WIDTH / img.width;

      if (scaleSize < 1) {
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.8
      );
    };
    img.onerror = () => resolve(file);
  });
}

function normalizeProfile(profile) {
  if (!profile) return null;
  const pick = (...candidates) => candidates.map((k) => profile[k]).find((v) => v !== undefined && v !== null);
  return {
    name:         pick("name", "fullName", "full_name"),
    dob:          pick("dob", "dateOfBirth", "date_of_birth"),
    incomeAnnual: pick("incomeAnnual", "income_annual", "annualIncome"),
    age:          pick("age"),
  };
}

export default function DocumentUpload({ sessionId, schemeId, schemeName, documents, onVerified }) {
  const router = useRouter();
  const { verifyDocument } = useAssistant();

  const [profile, setProfile] = useState(null);
  const inputRefs = useRef({});

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetch(`/api/profile?sessionId=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProfile(normalizeProfile(data.profile));
      })
      .catch((err) => console.error("Failed to load citizen profile:", err));
    return () => { cancelled = true; };
  }, [sessionId]);

  const [docState, setDocState] = useState(
    Object.fromEntries(
      (documents || []).map((d) => [
        d.id,
        {
          status: d.verified ? "verified" : "idle",
          message: d.verified ? "Already verified" : "",
          preview: d.ocr_text || "",
          crossCheck: null,
          fields: d.fields || {},
        },
      ])
    )
  );

  const [applyState, setApplyState] = useState("idle");
  const [applyError, setApplyError] = useState("");

  // Sync state & perform cross-check on stored/hydrated documents
  useEffect(() => {
    setDocState((prev) => {
      const next = { ...prev };
      for (const d of documents || []) {
        const current = next[d.id];
        if (d.verified && current?.status !== "verified" && current?.status !== "failed") {
          next[d.id] = {
            status: "verified",
            message: current?.message || "Already verified",
            preview: d.ocr_text || current?.preview || "",
            fields: d.fields || current?.fields || {},
            crossCheck: current?.crossCheck || null,
          };
        } else if (!next[d.id]) {
          next[d.id] = { status: "idle", message: "", preview: "", fields: {}, crossCheck: null };
        }
      }
      return next;
    });
  }, [JSON.stringify((documents || []).map((d) => [d.id, d.verified, d.ocr_text]))]);

  // Evaluate cross-check rules on mount/update and override status if a mismatch exists
  useEffect(() => {
    if (!profile) return;

    (documents || []).forEach(async (doc) => {
      const fieldMap = DOC_FIELD_MAP[doc.id];
      const state = docState[doc.id];

      if (fieldMap && (state?.status === "verified" || state?.status === "idle")) {
        try {
          const fields = state?.fields || {};
          const raw = await verifyDocument(doc.name, fields, profile, fieldMap);
          const result = cleanCrossCheck(raw);

          if (fieldMap.dob) {
            const ageMismatch = findAgeMismatch(profile.age, fields?.[fieldMap.dob]);
            if (ageMismatch) {
              result.matches = false;
              result.mismatches = [...(result.mismatches || []), ageMismatch];
            }
          }

          const hasCritical = result && !result.matches && result.mismatches?.some((m) => m.severity === "critical");

          setDocState((prev) => ({
            ...prev,
            [doc.id]: {
              ...prev[doc.id],
              status: hasCritical ? "failed" : prev[doc.id]?.status,
              message: hasCritical ? "❌ Profile mismatch detected. Please re-upload a correct document." : prev[doc.id]?.message,
              crossCheck: result,
            },
          }));
        } catch (err) {
          console.error("Cross-check evaluation failed:", err);
        }
      }
    });
  }, [profile]);

  function setDoc(docId, patch) {
    setDocState((prev) => ({ ...prev, [docId]: { ...prev[docId], ...patch } }));
  }

  async function handleFile(doc, file) {
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setDoc(doc.id, { status: "failed", message: "Only images (JPG, PNG) or PDF allowed." });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setDoc(doc.id, { status: "failed", message: "File too large. Max 10MB." });
      return;
    }

    setDoc(doc.id, { status: "uploading", message: "Processing & verifying document..." });

    try {
      const processedFile = await compressImage(file);

      const form = new FormData();
      form.append("file",       processedFile);
      form.append("sessionId",  sessionId);
      form.append("schemeId",   schemeId);
      form.append("documentId", doc.id);
      form.append("docName",    doc.name);

      const res  = await fetch("/api/ocr", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Document processing failed");

      const fields = data.fields || {};

      let crossCheckResult = null;
      const fieldMap = DOC_FIELD_MAP[doc.id];
      if (data.verified && fieldMap && profile) {
        try {
          crossCheckResult = cleanCrossCheck(
            await verifyDocument(doc.name, fields, profile, fieldMap)
          );

          if (fieldMap.dob) {
            const ageMismatch = findAgeMismatch(profile.age, fields?.[fieldMap.dob]);
            if (ageMismatch) {
              crossCheckResult.matches = false;
              crossCheckResult.mismatches = [...(crossCheckResult.mismatches || []), ageMismatch];
            }
          }
        } catch (err) {
          console.error("Document cross-check failed:", err);
        }
      }

      const hasCriticalMismatch =
        crossCheckResult &&
        !crossCheckResult.matches &&
        crossCheckResult.mismatches?.some((m) => m.severity === "critical");

      const finalVerified = data.verified && !hasCriticalMismatch;

      setDoc(doc.id, {
        status:     finalVerified ? "verified" : "failed",
        message:    finalVerified
                      ? `✅ ${doc.name} verified successfully!`
                      : hasCriticalMismatch
                      ? "❌ Document details do not match your profile. Please re-upload the correct document."
                      : data.message || "Document verification failed.",
        preview:    data.extractedInfo || "",
        fields:     fields,
        crossCheck: crossCheckResult,
      });

      if (finalVerified && onVerified) {
        onVerified(doc.id);
      }
    } catch (err) {
      setDoc(doc.id, {
        status:  "failed",
        message: err.message || "Upload failed. Please try again.",
      });
      console.error(err);
    }
  }

  async function handleApply() {
    setApplyState("submitting");
    setApplyError("");

    try {
      const res = await fetch("/api/applications", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId, schemeId, schemeName }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Application failed");

      setApplyState("success");

      setTimeout(() => {
        router.push("/track-applications");
      }, 1500);
    } catch (err) {
      setApplyState("failed");
      setApplyError(err.message || "Could not submit application. Please try again.");
      console.error(err);
    }
  }

  if (!documents || documents.length === 0) return null;

  const verifiedCount = Object.values(docState).filter((s) => s.status === "verified").length;
  const totalCount    = documents.length;
  const pct           = Math.round((verifiedCount / totalCount) * 100);

  const hasCriticalMismatch = Object.values(docState).some((s) =>
    s.crossCheck && !s.crossCheck.matches && s.crossCheck.mismatches?.some((m) => m.severity === "critical")
  );

  const readyToApply = verifiedCount === totalCount && totalCount > 0 && !hasCriticalMismatch;

  return (
    <div className="doc-upload-panel">
      <div className="doc-panel-header">
        <div className="doc-panel-title">📋 Required Documents</div>
        <div className="doc-panel-progress">
          <div className="doc-progress-bar">
            <div className="doc-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="doc-progress-label">{verifiedCount}/{totalCount} verified</span>
        </div>
      </div>

      <div className="doc-list">
        {documents.map((doc) => {
          const state = docState[doc.id] || { status: "idle", message: "", preview: "" };
          const isUploading = state.status === "uploading";

          return (
            <div key={doc.id} className={`doc-row doc-row-${state.status}`}>
              <div className="doc-row-left">
                <span className="doc-status-icon">{STATUS_ICON[state.status]}</span>
                <div className="doc-info">
                  <div className="doc-name">{doc.name}</div>
                  <div className="doc-desc">{doc.description}</div>

                  {state.message && (
                    <div className={`doc-message ${state.status === "verified" ? "doc-msg-ok" : "doc-msg-err"}`}>
                      {state.message}
                    </div>
                  )}

                  {state.preview && state.status === "verified" && (
                    <div className="doc-preview">
                      <span className="doc-preview-label">Extracted:</span>
                      <span className="doc-preview-text">{state.preview}</span>
                    </div>
                  )}

                  {state.crossCheck && !state.crossCheck.matches && (
                    <div className="doc-crosscheck doc-crosscheck-critical" style={{ marginTop: "6px", color: "#f87171" }}>
                      {state.crossCheck.mismatches.map((m, i) => (
                        <div key={i}>⚠️ {m.field}: form says "{m.formValue}", document says "{m.documentValue}" — {m.note}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="doc-row-right">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  ref={(el) => (inputRefs.current[doc.id] = el)}
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(doc, e.target.files[0])}
                />

                <button
                  className="doc-upload-btn"
                  disabled={isUploading}
                  onClick={() => inputRefs.current[doc.id]?.click()}
                >
                  {isUploading ? "Scanning..." : state.status === "verified" ? "Re-upload" : "Upload Document"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasCriticalMismatch && (
        <div className="doc-complete-section" style={{ marginTop: "16px" }}>
          <div className="doc-crosscheck doc-crosscheck-critical" style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#f87171" }}>
            ⚠️ We found a mismatch between your form details and an uploaded document. Please re-upload the correct document to proceed.
          </div>
        </div>
      )}

      {readyToApply && (
        <div className="doc-complete-section">
          {applyState !== "success" && (
            <div className="doc-complete-banner">
              🎉 Sabhi documents verify ho gaye! Aap apply karne ke liye taiyaar hain.
            </div>
          )}

          {applyState === "success" && (
            <div className="doc-complete-banner doc-apply-success">
              ✅ Application submitted successfully! Redirecting to Track Applications...
            </div>
          )}

          {applyState === "failed" && (
            <div className="doc-apply-error">{applyError}</div>
          )}

          {applyState !== "success" && (
            <button
              className="doc-apply-btn"
              onClick={handleApply}
              disabled={applyState === "submitting"}
            >
              {applyState === "submitting" ? "Submitting..." : "Apply Now →"}
            </button>
          )}

          {applyState !== "success" && (
            <a
              href={`/application-support?scheme=${schemeId}`}
              className="btn-link"
              style={{ marginLeft: "12px" }}
            >
              📥 Get pre-filled application PDF →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
// }
