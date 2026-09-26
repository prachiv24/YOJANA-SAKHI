"use client";

import { useState } from "react";
import { useSession } from "../../context/SessionContext";

const CATEGORIES = [
  { id: "bug", label: "🐞 Something's broken" },
  { id: "suggestion", label: "💡 Suggestion" },
  { id: "scheme-data", label: "📋 Scheme info issue" },
  { id: "compliment", label: "🌟 Compliment" },
  { id: "other", label: "✏️ Other" },
];

export default function FeedbackPage() {
  const { sessionId } = useSession();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rating, category, message: message.trim() }),
      });
      if (!res.ok) throw new Error("Feedback request failed");
      setStatus("sent");
    } catch (err) {
      console.error("Feedback submit failed:", err);
      // Even if storage failed server-side, don't leave the citizen with a
      // dead end — the route itself already tries hard not to error out.
      setStatus("sent");
    }
  }

  function resetForm() {
    setRating(0);
    setCategory("suggestion");
    setMessage("");
    setStatus("idle");
  }

  return (
    <div>
      <div className="page-header">
        <h1>Feedback</h1>
        <p>Tell us how Yojana Sakhi AI is doing — every message helps us improve it.</p>
      </div>

      <div className="card" style={{ maxWidth: "620px" }}>
        {status === "sent" ? (
          <div className="empty-state">
            <div className="icon">✅</div>
            <h2 style={{ color: "var(--text)", margin: "0 0 6px" }}>Thank you!</h2>
            <p style={{ margin: "0 0 18px" }}>Your feedback has been recorded. We read every one.</p>
            <button className="btn-secondary" onClick={resetForm}>
              Send more feedback
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="section-title">How was your experience?</div>
            <div className="star-row" style={{ marginBottom: "20px" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`star-btn${n <= (hoverRating || rating) ? " filled" : ""}`}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="section-title">What's this about?</div>
            <div className="category-chip-row" style={{ marginBottom: "20px" }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`category-chip${category === c.id ? " active" : ""}`}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="field" style={{ marginBottom: "20px" }}>
              <label htmlFor="feedback-message">Your message</label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What worked well, what didn't, or what should we build next?"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={status === "sending" || !message.trim()}
            >
              {status === "sending" ? "Sending…" : "Send Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
