"use client";

import Link from "next/link";

const CAPABILITIES = [
  {
    icon: "🧭",
    title: "Scheme guidance chat",
    desc: "Ask about any welfare scheme in plain language — Sakhi AI figures out what to ask you next and saves your profile as you go.",
    cta: { href: "/", label: "Open on Dashboard" },
  },
  {
    icon: "💡",
    title: "Eligibility gap explainer",
    desc: "When you don't qualify yet, Sakhi AI explains exactly why in plain words — and how to fix it, if it's fixable.",
    cta: { href: "/eligibility", label: "Check eligibility" },
  },
  {
    icon: "🔍",
    title: "Document verification",
    desc: "Upload a document and Gemini Vision reads it, checks it's the right type, and extracts the key fields automatically.",
    cta: { href: "/documents", label: "Upload documents" },
  },
  {
    icon: "🛡️",
    title: "Document-to-form cross-check",
    desc: "After OCR, Sakhi AI compares the extracted name, DOB, and income against your saved profile and flags real mismatches before you submit.",
    cta: { href: "/documents", label: "See it in action" },
  },
  {
    icon: "🗣️",
    title: "OCR fallback conversation",
    desc: "If a photo is too blurry to read, instead of a dead-end error, Sakhi AI asks one short question to get the same information as text.",
    cta: { href: "/documents", label: "Try uploading" },
  },
  {
    icon: "📥",
    title: "Post-application next steps",
    desc: "Once you apply, Sakhi AI gives a realistic, plain-language summary of what happens next and what to do if there's no update.",
    cta: { href: "/track-applications", label: "Track applications" },
  },
];

export default function AiAssistantPage() {
  return (
    <div>
      <div className="page-header">
        <h1>AI Assistant</h1>
        <p>
          Yojana Sakhi AI is one assistant working across every page — here's everything it can
          do for you right now.
        </p>
      </div>

      <div className="capability-grid">
        {CAPABILITIES.map((c) => (
          <div key={c.title} className="capability-card">
            <div className="capability-icon">{c.icon}</div>
            <div className="capability-title">{c.title}</div>
            <div className="capability-desc">{c.desc}</div>
            <Link
              href={c.cta.href}
              className="btn-link"
              style={{ display: "inline-block", marginTop: "12px" }}
            >
              {c.cta.label} →
            </Link>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-title-row">
          <div className="card-title">💬 Talk to Sakhi AI right now</div>
        </div>
        <p style={{ color: "var(--text-dim)", fontSize: "13.5px", lineHeight: 1.6, margin: "0 0 12px" }}>
          The full conversation lives on the Dashboard, where Sakhi AI can save your profile as
          you talk, check eligibility, and guide you toward the right schemes. It replies in
          whichever of the 22 supported languages you type or speak in.
        </p>
        <Link href="/" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
          Open Dashboard Chat →
        </Link>
      </div>
    </div>
  );
}
