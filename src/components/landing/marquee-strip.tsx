"use client";

import { Marquee } from "@/components/motion/marquee";
import { useLanguage } from "@/components/i18n/language-provider";

export function MarqueeStrip() {
  const { t } = useLanguage();
  const m = t.marquee;

  return (
    <section className="tone-light-pure border-y border-ink-900/[0.06] py-8">
      <div className="mx-auto flex max-w-container-xl flex-col items-center gap-5 px-5">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-500">{m.label}</span>
        <Marquee duration="38s" className="w-full">
          {m.items.map((it, i) => (
            <span key={i} className="mx-5 inline-flex items-center gap-4 text-lg font-semibold text-ink-700 sm:text-xl">
              {it}
              <span className="h-1.5 w-1.5 rounded-full bg-jade-500/60" />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
