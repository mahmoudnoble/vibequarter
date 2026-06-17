"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "./section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

const serif = { fontFamily: '"Times New Roman", Times, serif' } as const;

/** Premium "after" — a real VibeQuarter-built clinic site, with a real photo. */
function AfterPreview() {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-jade-600" />
          <span className="text-sm font-bold text-ink-900">Aria Dental</span>
        </div>
        <div className="hidden items-center gap-4 text-[11px] font-medium text-ink-500 sm:flex">
          <span>Services</span>
          <span>About</span>
          <span>Contact</span>
        </div>
        <div className="rounded-md bg-jade-600 px-3 py-1.5 text-[11px] font-bold text-white">Book now</div>
      </div>
      <div className="grid flex-1 grid-cols-2">
        <div className="flex flex-col justify-center gap-2 p-5">
          <span className="w-fit rounded-full bg-jade-500/12 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-jade-700">
            Dental · Riyadh
          </span>
          <div className="font-display text-lg font-bold leading-tight text-ink-900 sm:text-2xl">A brighter smile, booked online.</div>
          <p className="text-[11px] leading-relaxed text-ink-500">Modern dentistry in the heart of Riyadh — same-day appointments.</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="rounded-md bg-jade-600 px-3 py-1.5 text-[10px] font-bold text-white">Book appointment</span>
            <span className="rounded-md border border-ink-200 px-3 py-1.5 text-[10px] font-semibold text-ink-700">Our services</span>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <Image src="/img/clinic.jpg" alt="Modern dental clinic" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-[9px] font-semibold text-ink-800 shadow-sm backdrop-blur">
            ★ 4.9 · 320+ reviews
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dated "before" — cramped, clip-art era, with a badly-treated real photo. */
function BeforePreview() {
  return (
    <div className="flex h-full flex-col bg-[#e7e7df]">
      <div className="flex items-center justify-between bg-[#37598c] px-4 py-2.5">
        <span className="text-[12px] font-bold text-white" style={serif}>
          Dr. Ahmed Dental Center
        </span>
        <span className="hidden text-[9px] text-white/80 sm:block" style={serif}>
          Home | About | Contact
        </span>
      </div>
      <div className="flex flex-1 gap-3 p-4">
        <div className="flex-1">
          <div className="text-[13px] font-bold text-[#aa3322]" style={serif}>
            Welcome to our website!!!
          </div>
          <div className="mt-2 space-y-1 text-[8.5px] leading-relaxed text-[#555]" style={serif}>
            <p>We are the best dental clinic in town. We provide many services for all your dental needs at very affordable prices.</p>
            <p>Call us today to book an appointment. Phone: 011-234-5678</p>
          </div>
          <div className="mt-2 text-[9px] text-[#1a3e8c] underline" style={serif}>
            Click here for more info »
          </div>
        </div>
        <Image
          src="/img/clinic.jpg"
          alt=""
          width={96}
          height={80}
          className="h-20 w-24 shrink-0 border-2 border-[#9a9a90] object-cover"
          style={{ filter: "sepia(0.35) grayscale(0.5) contrast(0.85)" }}
        />
      </div>
      <div className="bg-[#cfcfc6] py-1.5 text-center text-[8px] text-[#777]" style={serif}>
        © 2009 — Best viewed in Internet Explorer 6
      </div>
    </div>
  );
}

export function BeforeAfter() {
  const { t, locale } = useLanguage();
  const c = t.compare;
  const rtl = locale === "ar";
  const ref = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(52);
  const [drag, setDrag] = useState(false);

  const update = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let p = ((clientX - r.left) / r.width) * 100;
    if (rtl) p = 100 - p;
    setPct(Math.max(0, Math.min(100, p)));
  };

  return (
    <Section tone="light-pure" id="compare" bg={<div className="bg-grid-sm absolute inset-0 mask-fade-y opacity-40" />}>
      <div className="flex justify-center">
        <SectionHeading emoji={c.emoji} eyebrow={c.eyebrow} title={c.title} accent={c.accent} desc={c.desc} className="max-w-2xl" />
      </div>

      <Reveal variant="scale" className="mx-auto mt-12 max-w-4xl">
        <div className="mb-4 flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-ink-500">
            <span className="h-2 w-2 rounded-full bg-ink-400" />
            {c.before}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-jade-700">
            {c.after}
            <span className="h-2 w-2 rounded-full bg-jade-500" />
          </span>
        </div>
        <div
          ref={ref}
          onPointerDown={(e) => {
            setDrag(true);
            (e.target as Element).setPointerCapture?.(e.pointerId);
            update(e.clientX);
          }}
          onPointerMove={(e) => drag && update(e.clientX)}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
          className={cn(
            "relative aspect-[16/11] w-full touch-none select-none overflow-hidden rounded-2xl border border-ink-200 shadow-card sm:aspect-[2/1]",
            drag ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <div className="absolute inset-0">
            <AfterPreview />
          </div>
          <div className="absolute inset-0" style={{ clipPath: rtl ? `inset(0 0 0 ${100 - pct}%)` : `inset(0 ${100 - pct}% 0 0)` }}>
            <BeforePreview />
          </div>

          <div className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_0_1px_rgba(10,15,22,0.08)]" style={rtl ? { right: `${pct}%` } : { left: `${pct}%` }}>
            <div className="absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-lift ltr:-translate-x-1/2 rtl:translate-x-1/2">
              <Icon name="MoveHorizontal" className="h-5 w-5" />
            </div>
          </div>

          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-ink-600 backdrop-blur">
            {c.hint}
          </span>

          <input type="range" min={0} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))} aria-label={c.hint} className="sr-only" />
        </div>
      </Reveal>
    </Section>
  );
}
