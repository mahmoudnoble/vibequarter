"use client";

import { useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LangSwitch() {
  const { locale, toggle } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={locale === "en" ? "التبديل إلى العربية" : "Switch to English"}
      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-ink-900/10 bg-white/60 px-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-white"
    >
      <Icon name="Languages" className="h-[17px] w-[17px]" />
      <span className="font-mono text-xs">{locale === "en" ? "ع" : "EN"}</span>
    </button>
  );
}

export function Nav() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-container-xl px-3 sm:px-5">
        <motion.div
          initial={false}
          animate={{ paddingTop: scrolled ? 8 : 12, paddingBottom: scrolled ? 8 : 12 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "mt-3 flex items-center justify-between gap-3 rounded-2xl px-3 sm:px-4",
            scrolled ? "glass shadow-glass" : "bg-transparent",
          )}
        >
          <Logo size="sm" />

          <nav className="hidden items-center gap-0.5 lg:flex">
            {t.nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-900/[0.05] hover:text-ink-900"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LangSwitch />
            <a
              href="#pricing"
              className="hidden h-10 items-center rounded-lg px-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-900/[0.05] sm:inline-flex"
            >
              {t.nav.call}
            </a>
            <a href="#top" className={cn(buttonClasses({ size: "sm" }), "hidden h-10 sm:inline-flex")}>
              {t.nav.build}
              <Icon name="ArrowRight" className="h-4 w-4 rtl:-scale-x-100" />
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t.nav.menu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink-900/10 bg-white/60 text-ink-800 transition-colors hover:bg-white lg:hidden"
            >
              <Icon name="Menu" className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-3 top-3 z-50 rounded-2xl border border-ink-900/10 bg-white p-4 shadow-lift lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.nav.close}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink-900/10 text-ink-800 hover:bg-ink-50"
                >
                  <Icon name="X" className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-4 flex flex-col">
                {t.nav.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-semibold text-ink-800 hover:bg-ink-50"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <div className="mt-4 flex flex-col gap-2.5">
                <a
                  href="#pricing"
                  onClick={() => setOpen(false)}
                  className={buttonClasses({ variant: "secondary", size: "md", className: "w-full" })}
                >
                  {t.nav.call}
                </a>
                <a href="#top" onClick={() => setOpen(false)} className={buttonClasses({ size: "md", className: "w-full" })}>
                  {t.nav.build}
                  <Icon name="ArrowRight" className="h-4 w-4 rtl:-scale-x-100" />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
