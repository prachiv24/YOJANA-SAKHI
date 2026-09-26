"use client";

import { useState } from "react";
import { useLanguage, LANGUAGES } from "../../context/LanguageContext";

export default function LanguagesPage() {
  const { language, setLanguage } = useLanguage();
  const [toast, setToast] = useState("");

  function handleSelect(code, nameLocal) {
    setLanguage(code);
    setToast(`Conversation language set to ${nameLocal}.`);
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Languages</h1>
        <p>
          Choose the language Yojana Sakhi AI speaks and types in. Powered by Bhashini's ULCA
          translation models — 22 official Indian languages supported.
        </p>
      </div>

      <div className="card">
        <div className="section-title">Select a language</div>
        <div className="lang-grid">
          {LANGUAGES.map((l) => {
            const active = l.code === language;
            return (
              <button
                key={l.code}
                type="button"
                className={`lang-card${active ? " active" : ""}`}
                onClick={() => handleSelect(l.code, l.nameLocal)}
              >
                {active && <span className="lang-card-check">✓</span>}
                <div className="lang-card-local">{l.nameLocal}</div>
                <div className="lang-card-name">{l.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {toast && <div className="settings-toast">✓ {toast}</div>}

      <div className="card" style={{ marginTop: "18px" }}>
        <div className="section-title">How this works</div>
        <p style={{ color: "var(--text-dim)", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
          Sakhi AI always reasons in English internally, so eligibility rules and scheme data
          stay accurate — then your chosen language is used to translate what you type and what
          Sakhi replies, right in your browser. Switch anytime; the chat widget on every page
          picks up your choice immediately, and it also auto-detects the language you type in.
        </p>
      </div>
    </div>
  );
}
