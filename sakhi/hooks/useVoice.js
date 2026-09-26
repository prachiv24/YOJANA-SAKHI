// hooks/useVoice.js
// Browser-native voice input (speech recognition) and voice output (speech synthesis)
// using the Web Speech API. No API keys, no registration, no backend calls needed.
// Works in Chrome/Edge natively. Supports Indian language locales for both
// recognition and synthesis.
//
// Usage inside your chat component:
//
//   const { isListening, isSpeaking, startListening, speak, isSupported } = useVoice();
//
//   // Mic button:
//   <button onClick={startListening} disabled={!isSupported}>
//     {isListening ? "🎤 Listening..." : "🎤 Speak"}
//   </button>
//
//   // startListening takes a callback that receives the transcribed text:
//   startListening((transcript) => sendMessage(transcript));
//
//   // After getting an AI response back as `replyText`:
//   speak(replyText);

"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

// Maps our app's language codes to the BCP-47 locale codes the Web Speech API expects
const LOCALE_MAP = {
  hi: "hi-IN",
  en: "en-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  ur: "ur-IN",
  or: "or-IN",
  as: "as-IN",
  ne: "ne-NP",
  sd: "sd-IN",
  sa: "sa-IN",
  // Fallback locales below aren't natively supported by most browsers yet;
  // they'll gracefully fall back to the browser's default voice/recognition.
  brx: "hi-IN",
  doi: "hi-IN",
  ks: "ur-IN",
  kok: "mr-IN",
  mai: "hi-IN",
  mni: "hi-IN",
  sat: "hi-IN",
};

function getLocale(langCode) {
  return LOCALE_MAP[langCode] || "en-IN";
}

export function useVoice() {
  const { language } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;
    setIsSupported(!!SpeechRecognition && hasSynthesis);
  }, []);

  // Starts listening via mic, calls onResult(transcript) once speech is recognized
  const startListening = useCallback((onResult, onError) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.("Voice input isn't supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getLocale(language);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      onResult?.(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      onError?.(
        event.error === "not-allowed"
          ? "Microphone access was denied. Please allow mic permissions."
          : "Could not recognize speech. Please try again or type instead."
      );
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Speaks the given text aloud in the user's selected language
  const speak = useCallback((text) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Cancel anything currently speaking, so responses don't overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLocale(language);
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}