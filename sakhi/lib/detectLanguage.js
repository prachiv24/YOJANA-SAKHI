// lib/detectLanguage.js
// Best-effort language detection based on Unicode script ranges.
// Works well for typed text since each Indian script maps to distinct
// Unicode blocks. Note: several languages share the same script (e.g. Hindi,
// Marathi, Sanskrit, Nepali, Konkani, Dogri, Maithili, Bodo all use
// Devanagari) — in those cases we default to the most common language for
// that script (Hindi) since script alone can't disambiguate further.

const SCRIPT_RANGES = [
  { code: "hi", regex: /[\u0900-\u097F]/ },   // Devanagari (hi, mr, ne, sa, kok, doi, mai, brx default to hi)
  { code: "bn", regex: /[\u0980-\u09FF]/ },   // Bengali-Assamese script (bn, as default to bn)
  { code: "pa", regex: /[\u0A00-\u0A7F]/ },   // Gurmukhi
  { code: "gu", regex: /[\u0A80-\u0AFF]/ },   // Gujarati
  { code: "or", regex: /[\u0B00-\u0B7F]/ },   // Odia
  { code: "ta", regex: /[\u0B80-\u0BFF]/ },   // Tamil
  { code: "te", regex: /[\u0C00-\u0C7F]/ },   // Telugu
  { code: "kn", regex: /[\u0C80-\u0CFF]/ },   // Kannada
  { code: "ml", regex: /[\u0D00-\u0D7F]/ },   // Malayalam
  { code: "ur", regex: /[\u0600-\u06FF]/ },   // Perso-Arabic (ur, sd, ks default to ur)
  { code: "mni", regex: /[\uABC0-\uABFF]/ },  // Meitei Mayek (Manipuri)
  { code: "sat", regex: /[\u1C50-\u1C7F]/ },  // Ol Chiki (Santali)
];

/**
 * Detects the most likely language code for a piece of typed text, based on
 * which script's characters appear most in it. Falls back to "en" if the
 * text is mostly Latin script or empty.
 */
export function detectLanguage(text) {
  if (!text || !text.trim()) return "en";

  const counts = {};
  for (const { code, regex } of SCRIPT_RANGES) {
    const matches = text.match(new RegExp(regex, "g"));
    if (matches) counts[code] = matches.length;
  }

  const entries = Object.entries(counts);
  if (entries.length === 0) return "en"; // no Indic script characters found -> assume English

  // Pick the script with the most character matches
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}