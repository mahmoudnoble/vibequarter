"use client";

import { Section } from "@/components/ui/section";
import { SectionHeading } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Aurora } from "@/components/motion/aurora";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

type Feat = { icon: string; title: string; body: string };

function Hub({ label }: { label: string }) {
  return (
    <div className="relative mx-auto grid h-44 w-44 place-items-center">
      <span className="absolute inset-0 animate-pulse-glow rounded-full bg-jade-500/25 blur-2xl" />
      <span className="absolute inset-0 rounded-full border border-white/15" />
      <span className="absolute inset-3 animate-spin-slow rounded-full border border-dashed border-white/10" />
      <span className="absolute inset-0 animate-spin-slow">
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-jade-400 shadow-[0_0_12px_rgba(46,203,148,0.9)]" />
      </span>
      <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-jade-400 to-jade-600 text-white shadow-brand-lg">
        <Icon name="Wand2" className="h-9 w-9" />
      </div>
      <span className="absolute -bottom-7 whitespace-nowrap font-mono text-[11px] uppercase tracking-wider text-ink-300">{label}</span>
    </div>
  );
}

function FeatureNode({ it, side }: { it: Feat; side: "l" | "r" }) {
  return (
    <div className="glass-dark relative rounded-2xl p-4">
      <div className={cn("flex items-start gap-3", side === "l" && "lg:flex-row-reverse lg:text-end")}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-jade-500/15 text-jade-300 ring-1 ring-inset ring-jade-500/25">
          <Icon name={it.icon} className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-[15px] font-bold text-white">{it.title}</h3>
          <p className="mt-1 text-[13px] leading-snug text-ink-300">{it.body}</p>
        </div>
      </div>
      <span
        className={cn(
          "absolute top-1/2 hidden h-[2px] w-7 -translate-y-1/2 lg:block",
          side === "l"
            ? "left-full bg-gradient-to-r from-transparent to-jade-500/60"
            : "right-full bg-gradient-to-l from-transparent to-jade-500/60",
        )}
      />
    </div>
  );
}

export function Features() {
  const { t } = useLanguage();
  const f = t.features;
  const half = Math.ceil(f.items.length / 2);
  const left = f.items.slice(0, half);
  const right = f.items.slice(half);

  return (
    <Section tone="dark" id="features" containerClassName="max-w-container-xl" bg={<Aurora intensity="soft" />}>
      <div className="flex justify-center">
        <SectionHeading tone="dark" emoji={f.emoji} eyebrow={f.eyebrow} title={f.title} accent={f.accent} desc={f.desc} className="max-w-2xl" />
      </div>

      <div className="mt-16 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <Stagger className="order-2 flex flex-col gap-4 lg:order-1" stagger={0.1}>
          {left.map((it, i) => (
            <StaggerItem key={i} variant="left">
              <FeatureNode it={it} side="l" />
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal variant="scale" className="order-1 lg:order-2">
          <Hub label={f.hub} />
        </Reveal>

        <Stagger className="order-3 flex flex-col gap-4" stagger={0.1}>
          {right.map((it, i) => (
            <StaggerItem key={i} variant="right">
              <FeatureNode it={it} side="r" />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
