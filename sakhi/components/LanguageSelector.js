// components/LanguageSelector.js
"use client";

import { useLanguage, LANGUAGES } from "../context/LanguageContext";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "8px",
        color: "inherit",
        padding: "6px 10px",
        fontSize: "14px",
      }}
      aria-label="Select language"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.nameLocal} ({l.name})
        </option>
      ))}
    </select>
  );
}