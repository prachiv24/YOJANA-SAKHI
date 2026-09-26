// components/ChatWidget.js
// Floating chat widget, visible on every page via AppShell.
// Wired to the real POST /api/chat endpoint. Supports:
// - Text input (always available, works even if voice fails)
// - 🎤 Voice input via the browser's Web Speech API (useVoice hook)
// - 🔊 Spoken responses in the user's selected language
// - Replies translated into the user's selected language before display/speech

"use client";
import { useState, useRef, useEffect } from "react";
import { useSession } from "../context/SessionContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { useVoice } from "../hooks/useVoice";
import { detectLanguage } from "../lib/detectLanguage";

export default function ChatWidget() {
  const { sessionId } = useSession();
  const { language } = useLanguage();
  const { isListening, isSpeaking, isSupported, startListening, speak, stopSpeaking } = useVoice();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); // [{ role: "user"|"assistant", text }]
  const [inputText, setInputText] = useState("");
  const [historyRef, setHistoryRef] = useState([]); // opaque, passed straight to backend
  const [isSending, setIsSending] = useState(false);
  const [micError, setMicError] = useState("");
  const [replyLanguage, setReplyLanguage] = useState(language); // auto-updates from typed text

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Translates text into the given language, falling back to the
  // original on any failure so a translation hiccup never blocks the chat.
  async function translateIfNeeded(text, targetLang) {
    if (!text || targetLang === "en") return text;
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceLanguage: "en", targetLanguage: targetLang }),
      });
      const data = await res.json();
      return data.translatedText || text;
    } catch (err) {
      console.error("Reply translation failed:", err);
      return text;
    }
  }

  async function sendMessage(rawText, langOverride) {
    const text = (rawText ?? inputText).trim();
    if (!text || !sessionId || isSending) return;

    // Auto-detect language from what was typed/spoken, unless a specific
    // language was already known (e.g. mic input already used a chosen locale)
    const detected = langOverride || detectLanguage(text);
    setReplyLanguage(detected);

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInputText("");
    setIsSending(true);
    setMicError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, history: historyRef }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setHistoryRef(data.history || []);

      const translatedReply = await translateIfNeeded(data.reply, detected);
      setMessages((prev) => [...prev, { role: "assistant", text: translatedReply }]);
      speak(translatedReply);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: err.message || "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleMicClick() {
    if (isListening) return;
    setMicError("");
    startListening(
      (transcript) => {
        if (transcript) sendMessage(transcript, language); // mic uses dropdown as the listening language hint
      },
      (error) => setMicError(error)
    );
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const currentLangLabel = LANGUAGES.find((l) => l.code === replyLanguage)?.nameLocal || "English";

  return (
    <>
      {/* Floating toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 1000,
            background: "linear-gradient(135deg, #a855f7, #ec4899)",
            color: "#fff", border: "none", borderRadius: "999px",
            padding: "14px 20px", fontSize: "14px", fontWeight: 600,
            boxShadow: "0 8px 24px rgba(168,85,247,0.4)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
          }}
        >
          💬 Chat with Sakhi AI
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 1000,
            width: "380px", maxWidth: "calc(100vw - 32px)", height: "560px",
            background: "#150f24", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px", display: "flex", flexDirection: "column",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)", overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: "linear-gradient(135deg, #a855f7, #ec4899)",
          }}>
            <div style={{ color: "#fff" }}>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>Sakhi AI</div>
              <div style={{ fontSize: "11px", opacity: 0.85 }}>Speaking in {currentLangLabel}</div>
            </div>
            <button
              onClick={() => { setIsOpen(false); stopSpeaking(); }}
              style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>
                👋 Ask me anything about government welfare schemes — type or use the mic.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  background: m.role === "user" ? "linear-gradient(135deg, #a855f7, #ec4899)" : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  fontSize: "14px",
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
              </div>
            ))}
            {isSending && (
              <div style={{ alignSelf: "flex-start", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                Sakhi is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {micError && (
            <div style={{ padding: "0 16px 8px", color: "#f87171", fontSize: "12px" }}>{micError}</div>
          )}

          {/* Input row — text always available, mic is a secondary option */}
          <div style={{ display: "flex", gap: "8px", padding: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isSending}
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px", padding: "10px 12px", color: "#fff", fontSize: "14px", outline: "none",
              }}
            />
            <button
              onClick={handleMicClick}
              disabled={!isSupported || isSending || isListening}
              title={isSupported ? "Speak your question" : "Voice input not supported in this browser"}
              style={{
                background: isListening ? "#ec4899" : "rgba(255,255,255,0.08)",
                border: "none", borderRadius: "10px", width: "42px", cursor: "pointer",
                fontSize: "16px", color: "#fff", opacity: isSupported ? 1 : 0.4,
              }}
            >
              🎤
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={isSending || !inputText.trim()}
              style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none",
                borderRadius: "10px", padding: "0 16px", color: "#fff", fontWeight: 600,
                cursor: "pointer", fontSize: "14px",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}