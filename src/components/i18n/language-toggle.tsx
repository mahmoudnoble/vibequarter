"use client";

import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";

export function LanguageToggle() {
  const { locale, toggle } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={locale === "en" ? "التبديل إلى العربية" : "Switch to English"}
      className="flex h-12 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
    >
      <Icon name="Languages" className="h-[18px] w-[18px]" />
      <span className="font-mono">{locale === "en" ? "ع" : "EN"}</span>
    </button>
  );
}
