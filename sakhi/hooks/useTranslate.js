// hooks/useTranslate.js
// Translates a given English text into the currently selected app language.
// Caches results in memory so the same text isn't re-translated repeatedly
// (e.g. when a component re-renders, or the same scheme description appears
// on multiple pages).

"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

// Simple in-memory cache shared across the whole app session: "lang:text" -> translatedText
const cache = new Map();

export function useTranslate(text, sourceLanguage = "en") {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState(text);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    // No translation needed if target matches source, or text is empty
    if (!text || language === sourceLanguage) {
      setTranslated(text);
      return;
    }

    const cacheKey = `${language}:${text}`;
    if (cache.has(cacheKey)) {
      setTranslated(cache.get(cacheKey));
      return;
    }

    const thisRequestId = ++requestIdRef.current;
    setLoading(true);

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceLanguage, targetLanguage: language }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Ignore stale responses if the language changed again mid-request
        if (thisRequestId !== requestIdRef.current) return;

        if (data.translatedText) {
          cache.set(cacheKey, data.translatedText);
          setTranslated(data.translatedText);
        } else {
          setTranslated(text); // fall back to original on failure
        }
      })
      .catch((err) => {
        console.error("Translation failed:", err);
        if (thisRequestId === requestIdRef.current) setTranslated(text);
      })
      .finally(() => {
        if (thisRequestId === requestIdRef.current) setLoading(false);
      });
  }, [text, language, sourceLanguage]);

  return { translated, loading };
}