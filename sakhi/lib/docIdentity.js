// lib/docIdentity.js

export const DOC_FIELD_MAP = {
  "aadhaar": { name: "name", dob: "dob" },
  "age-proof": { name: "holderName", dob: "dob" },
  "income-cert": { name: "holderName", incomeAnnual: "annualIncome" },
  "bpl-card": { name: "holderName" },
  "secc-proof": { name: "holderName" },
  "bank-passbook": { name: "accountHolderName" },
  "disability-cert": { name: "holderName" },
  "land-doc": { name: "ownerName" },
};

function toLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function extractFieldValue(ocrText, fieldKey) {
  if (!ocrText) return null;
  const label = toLabel(fieldKey);
  const line = ocrText.split("\n").find((l) => l.trim().startsWith(`${label}:`));
  if (!line) return null;
  return line.slice(line.indexOf(":") + 1).trim() || null;
}

function normalizeName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesRoughlyMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return true;
  if (na === nb) return true;

  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const shared = [...wordsA].filter((w) => wordsB.has(w) && w.length > 2);
  const smaller = Math.min(wordsA.size, wordsB.size);
  return smaller > 0 && shared.length / smaller >= 0.6;
}

function parseDob(dobStr) {
  if (!dobStr) return null;
  const s = String(dobStr).trim();

  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function computeAgeFromDob(dobStr) {
  const d = parseDob(dobStr);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

export function findAgeMismatch(formAge, extractedDob) {
  const documentAge = computeAgeFromDob(extractedDob);
  const formAgeNum = Number(formAge);

  if (documentAge == null || !Number.isFinite(formAgeNum) || formAgeNum <= 0) {
    return null;
  }

  const diff = Math.abs(documentAge - formAgeNum);
  if (diff <= 1) return null;

  return {
    field: "Age / Date of birth",
    formValue: `${formAgeNum} years (as entered)`,
    documentValue: `DOB ${extractedDob} (≈ ${documentAge} years old)`,
    severity: "critical",
    note: `The age entered in the form doesn't match the document's date of birth — about ${diff} years off. Please double-check the age or the uploaded document.`,
  };
}

export function findIdentityMismatches(documents, profile) {
  const identityDocs = (documents || [])
    .filter((d) => d.verified && DOC_FIELD_MAP[d.document_id]?.name)
    .map((d) => ({
      documentId: d.document_id,
      docName: d.doc_name || d.document_id,
      name: extractFieldValue(d.ocr_text, DOC_FIELD_MAP[d.document_id].name),
    }))
    .filter((d) => d.name);

  if (identityDocs.length === 0) return [];

  const profileName = profile?.name || profile?.fullName || profile?.full_name || null;

  let referenceName = profileName;
  if (!referenceName) {
    const counts = {};
    for (const d of identityDocs) {
      const key = normalizeName(d.name);
      counts[key] = (counts[key] || 0) + 1;
    }
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    referenceName = best ? identityDocs.find((d) => normalizeName(d.name) === best[0]).name : null;
  }

  if (!referenceName) return [];

  const warnings = [];
  for (const d of identityDocs) {
    if (!namesRoughlyMatch(d.name, referenceName)) {
      warnings.push({
        documentId: d.documentId,
        docName: d.docName,
        extractedName: d.name,
        expectedName: referenceName,
      });
    }
  }
  return warnings;
}