"use client";

import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";
import { site } from "@/lib/site";

export function Footer() {
  const { t } = useLanguage();
  const f = t.footer;
  const year = new Date().getFullYear();

  return (
    <footer className="tone-dark relative overflow-hidden border-t border-white/10 pb-8 pt-16">
      <div className="bg-grid-sm absolute inset-0 mask-fade-y opacity-30" />
      <div className="relative mx-auto max-w-container-xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo size="md" />
            <p className="mt-4 text-pretty text-sm leading-relaxed text-ink-400">{f.tagline}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-ink-300">
              <Icon name="Globe2" className="h-3.5 w-3.5 text-jade-300" />
              {f.madeIn}
            </p>
          </div>

          {f.columns.map((col, i) => (
            <div key={i}>
              <h4 className="font-mono text-xs uppercase tracking-wider text-ink-400">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link, k) => (
                  <li key={k}>
                    <a
                      href={link === t.nav.build ? "/sign-up" : "#"}
                      className="text-sm text-ink-300 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-ink-400">
            © {year} {site.legalName}. {f.rights}
          </p>
          <div className="flex items-center gap-2">
            {["X", "IG", "in"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-2 font-mono text-[11px] font-semibold text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
