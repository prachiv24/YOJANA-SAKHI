// context/LanguageContext.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const LANGUAGE_STORAGE_KEY = "yojana-sakhi-language";
const DEFAULT_LANGUAGE = "en";

export const LANGUAGES = [
  { code: "as", name: "Assamese",   nameLocal: "অসমীয়া" },
  { code: "bn", name: "Bengali",    nameLocal: "বাংলা" },
  { code: "brx", name: "Bodo",      nameLocal: "बड़ो" },
  { code: "doi", name: "Dogri",     nameLocal: "डोगरी" },
  { code: "en", name: "English",    nameLocal: "English" },
  { code: "gu", name: "Gujarati",   nameLocal: "ગુજરાતી" },
  { code: "hi", name: "Hindi",      nameLocal: "हिन्दी" },
  { code: "kn", name: "Kannada",    nameLocal: "ಕನ್ನಡ" },
  { code: "ks", name: "Kashmiri",   nameLocal: "कॉशुर" },
  { code: "kok", name: "Konkani",   nameLocal: "कोंकणी" },
  { code: "mai", name: "Maithili",  nameLocal: "मैथिली" },
  { code: "ml", name: "Malayalam",  nameLocal: "മലയാളം" },
  { code: "mni", name: "Manipuri",  nameLocal: "মৈতৈলোন্" },
  { code: "mr", name: "Marathi",    nameLocal: "मराठी" },
  { code: "ne", name: "Nepali",     nameLocal: "नेपाली" },
  { code: "or", name: "Odia",       nameLocal: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi",    nameLocal: "ਪੰਜਾਬੀ" },
  { code: "sa", name: "Sanskrit",   nameLocal: "संस्कृतम्" },
  { code: "sat", name: "Santali",   nameLocal: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "sd", name: "Sindhi",     nameLocal: "سنڌي" },
  { code: "ta", name: "Tamil",      nameLocal: "தமிழ்" },
  { code: "te", name: "Telugu",     nameLocal: "తెలుగు" },
  { code: "ur", name: "Urdu",       nameLocal: "اردو" },
];

const LanguageContext = createContext({ language: DEFAULT_LANGUAGE, setLanguage: () => {} });

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) setLanguageState(stored);
  }, []);

  function setLanguage(code) {
    setLanguageState(code);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}