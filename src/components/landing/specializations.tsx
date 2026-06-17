"use client";

import { Section } from "@/components/ui/section";
import { SectionHeading } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";

export function Specializations() {
  const { t } = useLanguage();
  const s = t.specializations;

  return (
    <Section tone="dark-bare" id="specializations" containerClassName="max-w-container-xl" className="pb-12 sm:pb-16 lg:pb-16">
      <div className="flex justify-center">
        <SectionHeading tone="dark" emoji={s.emoji} eyebrow={s.eyebrow} title={s.title} accent={s.accent} desc={s.desc} className="max-w-3xl" />
      </div>

      <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
        {s.items.map((it, i) => (
          <StaggerItem key={i} variant="up" className="[perspective:1200px]">
            <TiltCard className="group h-full rounded-2xl">
              <div className="glass-dark relative h-full overflow-hidden rounded-2xl p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-jade-500/25 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative flex items-center justify-between" style={{ transform: "translateZ(45px)" }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-jade-500/15 text-jade-300 ring-1 ring-inset ring-jade-500/25">
                    <Icon name={it.icon} className="h-6 w-6" />
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-jade-300">
                    {it.tag}
                  </span>
                </div>
                <h3 className="relative mt-5 font-display text-xl font-bold text-white" style={{ transform: "translateZ(30px)" }}>
                  <span className="me-1.5 text-lg" aria-hidden="true">{it.emoji}</span>
                  {it.name}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-ink-300">{it.blurb}</p>
              </div>
            </TiltCard>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal variant="up" className="mt-12">
        <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-jade-500/25 bg-gradient-to-r from-jade-500/10 via-white/[0.03] to-indigo-500/10 p-6 text-center sm:flex-row sm:text-start">
          <div className="flex items-center gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-jade-500/15 text-2xl ring-1 ring-inset ring-jade-500/25 sm:flex" aria-hidden="true">
              👋
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-white">{s.badgeTitle}</h3>
              <p className="mt-1 text-sm text-ink-300">{s.badgeDesc}</p>
            </div>
          </div>
          <a
            href="#pricing"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-ink-950 shadow-lift transition-transform hover:-translate-y-0.5"
          >
            {s.badgeCta}
            <Icon name="ArrowRight" className="h-4 w-4 rtl:-scale-x-100" />
          </a>
        </div>
      </Reveal>
    </Section>
  );
}
