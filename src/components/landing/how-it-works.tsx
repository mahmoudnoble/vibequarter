"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "./section-heading";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";

export function HowItWorks() {
  const { t, locale } = useLanguage();
  const h = t.how;
  const rtl = locale === "ar";
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "center 55%"] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const dotPos = useTransform(lineScale, (v) => `${v * 100}%`);

  return (
    <Section tone="light" id="how" bg={<div className="bg-grid-sm absolute inset-0 mask-fade-y opacity-50" />}>
      <div className="flex justify-center">
        <SectionHeading emoji={h.emoji} eyebrow={h.eyebrow} title={h.title} accent={h.accent} desc={h.desc} className="max-w-2xl" />
      </div>

      <div ref={ref} className="relative mt-16">
        {/* Connector line (desktop) */}
        <div className="pointer-events-none absolute inset-x-[16%] top-[58px] hidden h-[3px] lg:block">
          <div className="absolute inset-0 rounded-full bg-ink-200" />
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-jade-500 via-cyan-500 to-indigo-500"
            style={{ scaleX: reduce ? 1 : lineScale, transformOrigin: rtl ? "right" : "left" }}
          />
          {!reduce && (
            <motion.span
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(16,185,129,0.35)]"
              style={rtl ? { right: dotPos } : { left: dotPos }}
            />
          )}
        </div>

        <Stagger className="grid gap-12 lg:grid-cols-3 lg:gap-6" stagger={0.14}>
          {h.steps.map((s, i) => (
            <StaggerItem key={i} variant="up" className="relative flex flex-col items-center text-center">
              <div className="relative mb-6">
                <span className="absolute inset-0 -z-10 animate-pulse-glow rounded-full bg-jade-500/15 blur-xl" />
                <div className="grid h-[116px] w-[116px] place-items-center rounded-full bg-white shadow-card ring-1 ring-ink-100">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-jade-500/10 text-3xl">
                    <span aria-hidden="true">{s.emoji}</span>
                  </div>
                </div>
                <span className="absolute -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950 font-mono text-sm font-bold text-white ring-4 ring-ink-50 ltr:-right-1 rtl:-left-1">
                  {i + 1}
                </span>
                <span className="absolute -bottom-1 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-xl bg-white text-jade-600 shadow-card ring-1 ring-ink-100">
                  <Icon name={s.icon} className="h-[18px] w-[18px]" />
                </span>
              </div>

              <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-jade-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-jade-700">
                <Icon name="Clock" className="h-3 w-3" strokeWidth={2.4} />
                {s.tag}
              </span>
              <h3 className="font-display text-xl font-bold text-ink-950">
                <span className="me-1.5 text-lg" aria-hidden="true">{s.emoji}</span>
                {s.title}
              </h3>
              <p className="mt-2 max-w-xs text-pretty text-[15px] leading-relaxed text-ink-600">{s.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
