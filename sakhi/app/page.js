// "use client";

// import { useEffect, useRef, useState } from "react";
// import Link from "next/link";
// import { useSession } from "../context/SessionContext";
// import { useLanguage, LANGUAGES } from "../context/LanguageContext";
// import { useVoice } from "../hooks/useVoice";
// import { useTranslate } from "../hooks/useTranslate";
// import { detectLanguage } from "../lib/detectLanguage";
// import { SCHEMES } from "../data/schemes.js";
// import SakhiStamp from "../components/SakhiStamp";
// import "./dashboard.css";

// const GREETING_HINGLISH =
//   "Namaste! Main Yojana Sakhi hoon — aapki sarkari yojana sahayak. \n\nApni situation batayein, main aapke liye sahi yojanaon ki jaankari dhoondhungi aur aavedan mein poori madad karungi.\n\nNeeche diye buttons se shuru karein ya seedha likhein.";

// const GREETING_ENGLISH =
//   "Namaste! I am Yojana Sakhi, your government scheme assistant. \n\nTell me your situation, and I will find the right schemes for you and help you completely with the application.\n\nStart with the buttons below, or type directly.";

// const QUICK_STARTS = [
//   { icon: "🙏", text: "Mere pati guzar gaye, 2 bachche hain" },
//   { icon: "🏠", text: "Ghar banane ki madad chahiye" },
//   { icon: "👵", text: "Mujhe pension chahiye" },
//   { icon: "🌾", text: "Main kisan hoon, madad chahiye" },
// ];

// const POPULAR_SCHEME_IDS = ["pm-kisan", "ab-pmjay", "pmay-g", "pmuy"];
// const SCHEME_ICON = {
//   pension: "👵",
//   housing: "🏠",
//   "financial-inclusion": "🏦",
//   agriculture: "🌾",
//   household: "🔥",
//   health: "❤️",
// };

// export default function Dashboard() {
//   const { sessionId } = useSession();
//   const { language } = useLanguage();
//   const { isListening, isSupported, startListening, speak, stopSpeaking } = useVoice();

//   const { translated: translatedGreeting } = useTranslate(GREETING_ENGLISH, "en");
//   const greetingToShow = translatedGreeting;

//   const [messages, setMessages] = useState([
//     {
//       role: "assistant",
//       content: GREETING_HINGLISH,
//     },
//   ]);
//   const [apiHistory, setApiHistory] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [micError, setMicError] = useState("");
//   const bottomRef = useRef(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, loading]);

//   function resolveReplyLanguage(typedText) {
//     const scriptDetected = detectLanguage(typedText);
//     if (scriptDetected !== "en") return scriptDetected;
//     return language;
//   }

//   async function translateIfNeeded(text, targetLang) {
//     if (!text || targetLang === "en") return text;
//     try {
//       const res = await fetch("/api/translate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text, sourceLanguage: "en", targetLanguage: targetLang }),
//       });
//       const data = await res.json();
//       return data.translatedText || text;
//     } catch (err) {
//       console.error("Reply translation failed:", err);
//       return text;
//     }
//   }

//   // Accepts inputMode ("text" or "voice") to determine if response should be spoken
//   async function sendMessage(e, presetText, inputMode = "text") {
//     if (e) e.preventDefault();
//     const text = (presetText ?? input).trim();
//     if (!text || loading || !sessionId) return;

//     // Stop any ongoing speech if user submits a new query
//     stopSpeaking();

//     const replyLang = resolveReplyLanguage(text);

//     setMessages((prev) => [...prev, { role: "user", content: text }]);
//     setInput("");
//     setLoading(true);
//     setMicError("");

//     try {
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           sessionId, 
//           message: text, 
//           history: apiHistory,
//           inputMode
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.error || "Something went wrong.");

//       setApiHistory((prev) => [
//         ...prev,
//         { role: "user", content: text },
//         { role: "assistant", content: data.reply },
//       ]);

//       const displayReply = await translateIfNeeded(data.reply, replyLang);
//       setMessages((prev) => [...prev, { role: "assistant", content: displayReply }]);

//       // ONLY speak if user queried via Voice
//       if (inputMode === "voice") {
//         speak(displayReply);
//       }
//     } catch (err) {
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content:
//             "Maaf kijiye, kuch technical dikkat aa gayi. Kripya thodi der baad phir try karein.",
//         },
//       ]);
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   function handleMicClick() {
//     if (isListening) return;
//     setMicError("");
//     stopSpeaking();
//     startListening(
//       (transcript) => {
//         if (transcript) {
//           sendMessage(null, transcript, "voice");
//         }
//       },
//       (error) => setMicError(error)
//     );
//   }

//   const popularSchemes = POPULAR_SCHEME_IDS
//     .map((id) => SCHEMES.find((s) => s.id === id))
//     .filter(Boolean);

//   const [totalSchemeCount, setTotalSchemeCount] = useState(SCHEMES.length);

//   useEffect(() => {
//     let cancelled = false;

//     fetch("/api/schemes/browse?page=1&pageSize=1")
//       .then((res) => res.json())
//       .then((data) => {
//         if (!cancelled && data.total > SCHEMES.length) setTotalSchemeCount(data.total);
//       })
//       .catch(() => {});

//     return () => { cancelled = true; };
//   }, []);

//   const currentLangLabel = LANGUAGES.find((l) => l.code === language)?.nameLocal || "English";

//   return (
//     <div className="ys-dashboard">
//       {/* Hero Section with Integrated Brand Logo */}
//       <div className="hero">
//         <div className="hero-brand-container">
//           <div className="logo-badge-wrapper">
//             <SakhiStamp size={72} />
//           </div>
//           <div className="brand-text">
//             <div className="ys-eyebrow">
//               <span className="gov-seal">🏛️</span> Digital Seva · Government Scheme Assistant
//             </div>
//             <h1 className="ys-display">
//               YOJANA SAKHI <span className="ai-tag">AI</span>
//             </h1>
//           </div>
//         </div>

//         <p className="tagline">An Agentic AI Welfare Companion for Bharat</p>
//         <p className="quote">&ldquo;Helping every citizen claim the benefits they deserve&rdquo;</p>

//         <div className="hero-pills">
//           <span className="hero-pill">📜 {totalSchemeCount.toLocaleString()}+ Schemes</span>
//           <span className="hero-pill">📝 10M+ Inquiries</span>
//           <span className="hero-pill">🌐 22 Languages</span>
//           <span className="hero-pill">🤖 Agentic AI</span>
//         </div>
//       </div>

//       {/* Stats Section */}
//       <div className="stats-row">
//         <div className="stat-card">
//           <div className="stat-icon">🏛️</div>
//           <div>
//             <div className="stat-value">{totalSchemeCount.toLocaleString()}+</div>
//             <div className="stat-label">Government Schemes</div>
//             <div className="stat-sub">Explore welfare schemes</div>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon">💬</div>
//           <div>
//             <div className="stat-value">10M+</div>
//             <div className="stat-label">Inquiries Processed</div>
//             <div className="stat-sub">Citizens helped so far</div>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon">🌐</div>
//           <div>
//             <div className="stat-value">22</div>
//             <div className="stat-label">Languages Supported</div>
//             <div className="stat-sub">Breaking language barriers</div>
//           </div>
//         </div>
//       </div>

//       {/* Main Grid Section */}
//       <div className="dashboard-grid">
//         <div className="chat-card">
//           <div className="chat-card-header">
//             Aaj ki baat — Today&apos;s conversation
//             <span style={{ float: "right", fontSize: "12px", opacity: 0.6, fontWeight: 400 }}>
//               🌐 {currentLangLabel}
//             </span>
//           </div>

//           <div className="chat-window">
//             {messages.map((m, i) =>
//               m.role === "assistant" && i === 0 ? (
//                 <div className="chat-greeting" key={i}>
//                   <div className="chat-avatar"><SakhiStamp size={24} /></div>
//                   <div className="bubble assistant">{greetingToShow}</div>
//                 </div>
//               ) : (
//                 <div key={i} className={`bubble ${m.role}`}>
//                   {m.content}
//                 </div>
//               )
//             )}
//             {loading && <div className="bubble assistant pending">Sochte hue...</div>}
//             <div ref={bottomRef} />
//           </div>

//           {micError && (
//             <div style={{ color: "#f87171", fontSize: "13px", padding: "4px 0" }}>{micError}</div>
//           )}

//           <div className="quick-start-label">Jaldi Shuru Karein</div>
//           <div className="quick-start-grid">
//             {QUICK_STARTS.map((q) => (
//               <button
//                 key={q.text}
//                 type="button"
//                 className="quick-start-btn"
//                 onClick={() => sendMessage(null, q.text, "text")}
//                 disabled={loading || !sessionId}
//               >
//                 <span>{q.icon}</span>
//                 <span>{q.text}</span>
//               </button>
//             ))}
//           </div>

//           <form className="composer" onSubmit={(e) => sendMessage(e, null, "text")}>
//             <input
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Apni situation batayein... Hindi ya English mein"
//               disabled={loading || !sessionId}
//             />
//             <button
//               type="button"
//               onClick={handleMicClick}
//               disabled={loading || !sessionId || !isSupported || isListening}
//               title={isSupported ? "Speak your question" : "Voice input not supported in browser"}
//               style={{
//                 background: isListening ? "var(--pink)" : "transparent",
//                 border: "none",
//                 cursor: "pointer",
//                 fontSize: "18px",
//                 opacity: isSupported ? 1 : 0.4,
//                 padding: "0 8px",
//               }}
//             >
//               🎤
//             </button>
//             <button type="submit" disabled={loading || !input.trim() || !sessionId}>
//               ➤
//             </button>
//           </form>
//           <div className="chat-disclaimer">
//             Yojana Sakhi AI may make mistakes. Please verify important information on official government portals.
//           </div>
//         </div>

//         {/* Sidebar Cards */}
//         <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
//           <div className="card">
//             <div className="card-title-row">
//               <span className="card-title">Popular Schemes</span>
//               <Link className="link-muted" href="/scheme-discovery">View All</Link>
//             </div>
//             {popularSchemes.map((s) => (
//               <Link key={s.id} href="/scheme-discovery" className="scheme-row">
//                 <span className="scheme-icon">{SCHEME_ICON[s.category] || "📜"}</span>
//                 <div>
//                   <div className="scheme-name">{s.name}</div>
//                   <div className="scheme-sub">{s.benefitAmount}</div>
//                 </div>
//                 <span className="scheme-arrow">›</span>
//               </Link>
//             ))}
//           </div>

//           <div className="card">
//             <div className="card-title-row">
//               <span className="card-title">Quick Actions</span>
//             </div>
//             <div className="quick-actions">
//               <Link href="/eligibility" className="quick-action">
//                 <span className="quick-action-icon green">✅</span>
//                 Check Eligibility
//                 <span className="quick-action-arrow">›</span>
//               </Link>
//               <Link href="/track-applications" className="quick-action">
//                 <span className="quick-action-icon blue">📈</span>
//                 Track Application
//                 <span className="quick-action-arrow">›</span>
//               </Link>
//               <Link href="/documents" className="quick-action">
//                 <span className="quick-action-icon orange">📎</span>
//                 Upload Documents
//                 <span className="quick-action-arrow">›</span>
//               </Link>
//               <Link href="/scheme-discovery" className="quick-action">
//                 <span className="quick-action-icon purple">🔍</span>
//                 Scheme Discovery
//                 <span className="quick-action-arrow">›</span>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Landmark,
  MessageSquareText,
  Globe2,
  Bot,
  HeartHandshake,
  Home,
  UserCheck,
  Wheat,
  Sprout,
  HeartPulse,
  Flame,
  CheckSquare,
  TrendingUp,
  Paperclip,
  Search,
  ChevronRight,
  Mic,
  SendHorizontal,
  ScrollText,
} from "lucide-react";
import { useSession } from "../context/SessionContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { useVoice } from "../hooks/useVoice";
import { useTranslate } from "../hooks/useTranslate";
import { detectLanguage } from "../lib/detectLanguage";
import { SCHEMES } from "../data/schemes.js";
import SakhiStamp from "../components/SakhiStamp";
import "./dashboard.css";

const GREETING_HINGLISH =
  "Namaste! Main Yojana Sakhi hoon — aapki sarkari yojana sahayak. \n\nApni situation batayein, main aapke liye sahi yojanaon ki jaankari dhoondhungi aur aavedan mein poori madad karungi.\n\nNeeche diye buttons se shuru karein ya seedha likhein.";

const GREETING_ENGLISH =
  "Namaste! I am Yojana Sakhi, your government scheme assistant. \n\nTell me your situation, and I will find the right schemes for you and help you completely with the application.\n\nStart with the buttons below, or type directly.";

const QUICK_STARTS = [
  { icon: HeartHandshake, text: "Mere pati guzar gaye, 2 bachche hain" },
  { icon: Home, text: "Ghar banane ki madad chahiye" },
  { icon: UserCheck, text: "Mujhe pension chahiye" },
  { icon: Wheat, text: "Main kisan hoon, madad chahiye" },
];

const POPULAR_SCHEME_IDS = ["pm-kisan", "ab-pmjay", "pmay-g", "pmuy"];

const SCHEME_ICONS = {
  pension: UserCheck,
  housing: Home,
  "financial-inclusion": Landmark,
  agriculture: Sprout,
  household: Flame,
  health: HeartPulse,
};

export default function Dashboard() {
  const { sessionId } = useSession();
  const { language } = useLanguage();
  const { isListening, isSupported, startListening, speak, stopSpeaking } = useVoice();

  const { translated: translatedGreeting } = useTranslate(GREETING_ENGLISH, "en");
  const greetingToShow = translatedGreeting;

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: GREETING_HINGLISH,
    },
  ]);
  const [apiHistory, setApiHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [micError, setMicError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function resolveReplyLanguage(typedText) {
    const scriptDetected = detectLanguage(typedText);
    if (scriptDetected !== "en") return scriptDetected;
    return language;
  }

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

  async function sendMessage(e, presetText, inputMode = "text") {
    if (e) e.preventDefault();
    const text = (presetText ?? input).trim();
    if (!text || loading || !sessionId) return;

    stopSpeaking();

    const replyLang = resolveReplyLanguage(text);

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setMicError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId, 
          message: text, 
          history: apiHistory,
          inputMode
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data?.error || "Maaf kijiye, kuch technical dikkat aa gayi. Kripya thodi der baad phir try karein.",
          },
        ]);
        return;
      }

      setApiHistory((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: data.reply },
      ]);

      const displayReply = await translateIfNeeded(data.reply, replyLang);
      setMessages((prev) => [...prev, { role: "assistant", content: displayReply }]);

      if (inputMode === "voice") {
        speak(displayReply);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Maaf kijiye, network error issue. Kripya connection check karein.",
        },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleMicClick() {
    if (isListening) return;
    setMicError("");
    stopSpeaking();
    startListening(
      (transcript) => {
        if (transcript) {
          sendMessage(null, transcript, "voice");
        }
      },
      (error) => setMicError(error)
    );
  }

  const popularSchemes = POPULAR_SCHEME_IDS
    .map((id) => SCHEMES.find((s) => s.id === id))
    .filter(Boolean);

  const [totalSchemeCount, setTotalSchemeCount] = useState(SCHEMES.length);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/schemes/browse?page=1&pageSize=1")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.total > SCHEMES.length) setTotalSchemeCount(data.total);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const currentLangLabel = LANGUAGES.find((l) => l.code === language)?.nameLocal || "English";

  return (
    <div className="ys-dashboard">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-brand-container">
          <div className="logo-badge-wrapper">
            <SakhiStamp size={72} />
          </div>
          <div className="brand-text">
            <div className="ys-eyebrow">
              <Landmark size={14} className="eyebrow-icon" /> Digital Seva · Government Scheme Assistant
            </div>
            <h1 className="ys-display">
              YOJANA SAKHI <span className="ai-tag">AI</span>
            </h1>
          </div>
        </div>

        <p className="tagline">An Agentic AI Welfare Companion for Bharat</p>
        <p className="quote">&ldquo;Helping every citizen claim the benefits they deserve&rdquo;</p>

        <div className="hero-pills">
          <span className="hero-pill"><ScrollText size={14} /> {totalSchemeCount.toLocaleString()}+ Schemes</span>
          <span className="hero-pill"><MessageSquareText size={14} /> 10M+ Inquiries</span>
          <span className="hero-pill"><Globe2 size={14} /> 22 Languages</span>
          <span className="hero-pill"><Bot size={14} /> Agentic AI</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon"><Landmark size={22} /></div>
          <div>
            <div className="stat-value">{totalSchemeCount.toLocaleString()}+</div>
            <div className="stat-label">Government Schemes</div>
            <div className="stat-sub">Explore welfare schemes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><MessageSquareText size={22} /></div>
          <div>
            <div className="stat-value">10M+</div>
            <div className="stat-label">Inquiries Processed</div>
            <div className="stat-sub">Citizens helped so far</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Globe2 size={22} /></div>
          <div>
            <div className="stat-value">22</div>
            <div className="stat-label">Languages Supported</div>
            <div className="stat-sub">Breaking language barriers</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        <div className="chat-card">
          <div className="chat-card-header">
            Aaj ki baat — Today&apos;s conversation
            <span style={{ float: "right", fontSize: "12px", opacity: 0.6, fontWeight: 400, display: "flex", alignItems: "center", gap: "4px" }}>
              <Globe2 size={13} /> {currentLangLabel}
            </span>
          </div>

          <div className="chat-window">
            {messages.map((m, i) =>
              m.role === "assistant" && i === 0 ? (
                <div className="chat-greeting" key={i}>
                  <div className="chat-avatar"><SakhiStamp size={24} /></div>
                  <div className="bubble assistant">{greetingToShow}</div>
                </div>
              ) : (
                <div key={i} className={`bubble ${m.role}`}>
                  {m.content}
                </div>
              )
            )}
            {loading && <div className="bubble assistant pending">Sochte hue...</div>}
            <div ref={bottomRef} />
          </div>

          {micError && (
            <div style={{ color: "#f87171", fontSize: "13px", padding: "4px 0" }}>{micError}</div>
          )}

          <div className="quick-start-label">Jaldi Shuru Karein</div>
          <div className="quick-start-grid">
            {QUICK_STARTS.map((q) => {
              const QuickIcon = q.icon;
              return (
                <button
                  key={q.text}
                  type="button"
                  className="quick-start-btn"
                  onClick={() => sendMessage(null, q.text, "text")}
                  disabled={loading || !sessionId}
                >
                  <QuickIcon size={16} />
                  <span>{q.text}</span>
                </button>
              );
            })}
          </div>

          <form className="composer" onSubmit={(e) => sendMessage(e, null, "text")}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Apni situation batayein... Hindi ya English mein"
              disabled={loading || !sessionId}
            />
            <button
              type="button"
              onClick={handleMicClick}
              disabled={loading || !sessionId || !isSupported || isListening}
              title={isSupported ? "Speak your question" : "Voice input not supported in browser"}
              style={{
                background: isListening ? "var(--pink)" : "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isSupported ? 1 : 0.4,
                padding: "0 8px",
                color: isListening ? "#fff" : "var(--ys-marigold, #dd9a2e)",
              }}
            >
              <Mic size={18} />
            </button>
            <button 
              type="submit" 
              disabled={loading || !input.trim() || !sessionId}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <SendHorizontal size={16} />
            </button>
          </form>
          <div className="chat-disclaimer">
            Yojana Sakhi AI may make mistakes. Please verify important information on official government portals.
          </div>
        </div>

        {/* Right Sidebar Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card">
            <div className="card-title-row">
              <span className="card-title">Popular Schemes</span>
              <Link className="link-muted" href="/scheme-discovery">View All</Link>
            </div>
            {popularSchemes.map((s) => {
              const SchemeIcon = SCHEME_ICONS[s.category] || ScrollText;
              return (
                <Link key={s.id} href="/scheme-discovery" className="scheme-row">
                  <span className="scheme-icon"><SchemeIcon size={18} /></span>
                  <div>
                    <div className="scheme-name">{s.name}</div>
                    <div className="scheme-sub">{s.benefitAmount}</div>
                  </div>
                  <ChevronRight size={16} className="scheme-arrow" />
                </Link>
              );
            })}
          </div>

          <div className="card">
            <div className="card-title-row">
              <span className="card-title">Quick Actions</span>
            </div>
            <div className="quick-actions">
              <Link href="/eligibility" className="quick-action">
                <span className="quick-action-icon green"><CheckSquare size={16} /></span>
                Check Eligibility
                <ChevronRight size={16} className="quick-action-arrow" />
              </Link>
              <Link href="/track-applications" className="quick-action">
                <span className="quick-action-icon blue"><TrendingUp size={16} /></span>
                Track Application
                <ChevronRight size={16} className="quick-action-arrow" />
              </Link>
              <Link href="/documents" className="quick-action">
                <span className="quick-action-icon orange"><Paperclip size={16} /></span>
                Upload Documents
                <ChevronRight size={16} className="quick-action-arrow" />
              </Link>
              <Link href="/scheme-discovery" className="quick-action">
                <span className="quick-action-icon purple"><Search size={16} /></span>
                Scheme Discovery
                <ChevronRight size={16} className="quick-action-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}