"use client";

import { AnimatedGrid } from "@/components/motion/animated-grid";
import { Aurora } from "@/components/motion/aurora";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { Icon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

export function FinalCta() {
  const { t } = useLanguage();
  const f = t.finalCta;

  return (
    <section id="start" className="tone-dark relative isolate overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 z-0">
        <AnimatedGrid variant="dark" className="absolute inset-0 h-full w-full mask-radial opacity-80" />
        <Aurora intensity="medium" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <Reveal variant="fade" className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-jade-500/30 bg-jade-500/10 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-jade-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-jade-400" />
            </span>
            {f.eyebrow}
          </span>
        </Reveal>

        <Reveal variant="blur" as="h2" className="mt-6 text-balance font-display text-display-md font-bold leading-[0.98] text-white">
          {f.title} <span className="text-jade-accent">{f.accent}</span>
        </Reveal>

        <Reveal variant="up" delay={0.15} as="p" className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-300 sm:text-lg">
          {f.desc}
        </Reveal>

        <Reveal variant="up" delay={0.25} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Magnetic className="w-full sm:w-auto">
            <a href="#top" className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}>
              {f.build}
              <Icon name="ArrowRight" className="h-[18px] w-[18px] rtl:-scale-x-100" />
            </a>
          </Magnetic>
          <a
            href="#pricing"
            className="inline-flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-7 font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            <Icon name="Phone" className="h-[18px] w-[18px]" />
            {f.call}
          </a>
        </Reveal>

        <Reveal variant="up" delay={0.35} className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4">
          {f.stats.map((s, i) => (
            <div key={i} className={cn("flex flex-col items-center", i !== 0 && "border-white/10 ltr:border-l rtl:border-r")}>
              <span className="font-display text-2xl font-bold text-white sm:text-3xl">{s.value}</span>
              <span className="mt-1 text-[11px] leading-tight text-ink-400 sm:text-xs">{s.label}</span>
            </div>
          ))}
        </Reveal>

        <Reveal variant="fade" delay={0.45} as="p" className="mt-8 text-xs text-ink-500">
          {f.note}
        </Reveal>
      </div>
    </section>
  );
}
