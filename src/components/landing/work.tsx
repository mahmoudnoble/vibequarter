"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "./section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

type Item = { name: string; niche: string; metric: string; tone: string; img: string };

const dotTone: Record<string, string> = { jade: "bg-jade-500", indigo: "bg-indigo-500", cyan: "bg-cyan-500" };
const accentBg: Record<string, string> = { jade: "bg-jade-600", indigo: "bg-indigo-600", cyan: "bg-cyan-600" };
const accentSoft: Record<string, string> = { jade: "bg-jade-100", indigo: "bg-indigo-100", cyan: "bg-cyan-100" };

/** A believable one-page site "sample" shown inside the portfolio modal. */
function NicheSite({ it, sample }: { it: Item; sample: string }) {
  const accent = accentBg[it.tone] ?? accentBg.jade;
  const soft = accentSoft[it.tone] ?? accentSoft.jade;
  return (
    <div className="bg-white text-ink-900">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className={cn("h-7 w-7 rounded-lg", accent)} />
          <span className="font-display text-base font-bold">{it.name}</span>
        </div>
        <nav className="hidden items-center gap-5 text-sm text-ink-500 md:flex">
          <span>Home</span>
          <span>Services</span>
          <span>About</span>
          <span>Contact</span>
        </nav>
        <span className={cn("rounded-lg px-3.5 py-2 text-sm font-semibold text-white", accent)}>Book now</span>
      </div>

      <div className="relative h-60 sm:h-80">
        <Image src={it.img} alt={it.niche} fill sizes="(max-width: 768px) 100vw, 700px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent" />
        <span className="absolute start-6 top-6 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-white backdrop-blur">
          {sample}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <span className="mb-2 inline-block font-mono text-xs uppercase tracking-wider text-white/80">{it.niche}</span>
          <h2 className="max-w-md font-display text-2xl font-bold text-white sm:text-3xl">{it.name}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={cn("rounded-lg px-4 py-2 text-sm font-bold text-white", accent)}>Book appointment</span>
            <span className="rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-ink-900">Our services</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-7 sm:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">What we offer</h3>
          <span className="text-sm text-ink-500">View all</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((k) => (
            <div key={k} className="rounded-xl border border-ink-100 p-4">
              <div className={cn("mb-3 h-9 w-9 rounded-lg", soft)} />
              <div className="h-2.5 w-20 rounded-full bg-ink-200" />
              <div className="mt-2 h-2 w-full rounded-full bg-ink-100" />
              <div className="mt-1.5 h-2 w-3/4 rounded-full bg-ink-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-ink-950 px-5 py-7 text-white sm:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-lg font-bold">Ready when you are.</h3>
            <p className="text-sm text-ink-300">Pick a time that works — confirmed instantly.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Mon", "Tue", "Wed"].map((d) => (
              <span key={d} className="rounded-lg border border-white/15 px-3 py-2 text-xs">{d}</span>
            ))}
            <span className={cn("rounded-lg px-3 py-2 text-xs font-bold text-white", accent)}>Confirm</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkModal({ item, labels, onClose }: { item: Item | null; labels: { viewLive: string; sample: string; close: string }; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  // Conditional unmount (no AnimatePresence) guarantees the overlay is removed on
  // close — an exiting portal overlay can otherwise linger and block clicks.
  if (!mounted || !item) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/70 p-3 backdrop-blur-sm sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-lift"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            </span>
            <span className="ms-2 inline-flex items-center gap-1.5 truncate rounded-md bg-white/10 px-2.5 py-1 text-[11px] text-ink-300">
              <Icon name="ShieldCheck" className="h-3 w-3 text-jade-400" strokeWidth={2.4} />
              vibequarter.com
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href="#top" onClick={onClose} className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 sm:inline-flex">
              {labels.viewLive}
              <Icon name="ArrowUpRight" className="h-3.5 w-3.5 rtl:-scale-x-100" />
            </a>
            <button onClick={onClose} aria-label={labels.close} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-300 transition-colors hover:bg-white/10 hover:text-white">
              <Icon name="X" className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain">
          <NicheSite it={item} sample={labels.sample} />
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export function Work() {
  const { t } = useLanguage();
  const w = t.work;
  const [active, setActive] = useState(0);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <Section tone="dark-bare" id="work" containerClassName="max-w-container-xl" className="pt-12 sm:pt-16 lg:pt-16">
      <SectionHeading tone="dark" align="start" emoji={w.emoji} eyebrow={w.eyebrow} title={w.title} accent={w.accent} desc={w.desc} />

      <Reveal variant="up" className="mt-12">
        <div className="flex flex-col gap-3 md:h-[470px] md:flex-row">
          {w.items.map((it, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setOpenIdx(i)}
                aria-label={`${it.name} — ${it.niche}`}
                className={cn(
                  "group relative h-60 cursor-pointer overflow-hidden rounded-2xl border border-white/10 text-start ease-out-expo md:h-full",
                  "transition-[flex-grow,flex-basis] duration-500",
                  isActive ? "md:flex-[5]" : "md:flex-[1]",
                )}
              >
                <Image src={it.img} alt={`${it.name} — ${it.niche}`} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-transparent" />
                <div className={cn("absolute inset-0 bg-ink-950/40 transition-opacity duration-500", isActive ? "opacity-0" : "opacity-100 md:opacity-60")} />

                <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
                  <span className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-white/50" />
                    <span className="h-2 w-2 rounded-full bg-white/50" />
                    <span className="h-2 w-2 rounded-full bg-white/50" />
                  </span>
                  <span className="font-mono text-[11px] text-white/70">0{i + 1}</span>
                </div>

                <div className={cn("absolute inset-0 hidden items-center justify-center transition-opacity duration-300 md:flex", isActive ? "pointer-events-none opacity-0" : "opacity-100")}>
                  <span className="font-display text-base font-bold text-white [writing-mode:vertical-rl]">{it.name}</span>
                </div>

                <div className={cn("absolute inset-x-0 bottom-0 p-5 transition-opacity duration-500", isActive ? "opacity-100" : "opacity-100 md:opacity-0")}>
                  <span className={cn("mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white", dotTone[it.tone])}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {it.metric}
                  </span>
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-xl font-bold text-white">{it.name}</h3>
                      <p className="truncate text-sm text-ink-300">{it.niche}</p>
                    </div>
                    <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink-900 shadow-lift transition-transform group-hover:scale-105 md:flex">
                      <Icon name="ArrowUpRight" className="h-5 w-5 rtl:-scale-x-100" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Reveal>

      <WorkModal item={openIdx != null ? (w.items[openIdx] as Item) : null} labels={{ viewLive: w.viewLive, sample: w.sample, close: w.close }} onClose={() => setOpenIdx(null)} />
    </Section>
  );
}
