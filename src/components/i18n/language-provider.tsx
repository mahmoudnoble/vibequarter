"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { dictionaries, type Locale, type Dict } from "@/lib/i18n";

type Ctx = { locale: Locale; t: Dict; setLocale: (l: Locale) => void; toggle: () => void };

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Restore saved locale, else auto-detect from the browser (Arabic → RTL).
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("vq-locale")) as Locale | null;
    if (saved === "ar" || saved === "en") {
      setLocaleState(saved);
      return;
    }
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
    if (nav.toLowerCase().startsWith("ar")) setLocaleState("ar");
  }, []);

  // Reflect locale on <html> (dir + lang) and persist.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = locale;
    el.dir = locale === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("vq-locale", locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const toggle = useCallback(() => setLocaleState((l) => (l === "en" ? "ar" : "en")), []);

  return (
    <LanguageContext.Provider value={{ locale, t: dictionaries[locale], setLocale, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
