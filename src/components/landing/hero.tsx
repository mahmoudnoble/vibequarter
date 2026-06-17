"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { Aurora } from "@/components/motion/aurora";
import { Magnetic } from "@/components/motion/magnetic";
import { Parallax } from "@/components/motion/parallax";
import { WordReveal } from "@/components/motion/word-reveal";
import { Icon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Animated typed placeholder that cycles examples (overlay over the textarea). */
function CyclingPlaceholder({ items, prefix }: { items: string[]; prefix: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduce) {
      setN(items[i].length);
      return;
    }
    setN(0);
    let to: ReturnType<typeof setTimeout>;
    const tick = (k: number) => {
      setN(k);
      if (k < items[i].length) to = setTimeout(() => tick(k + 1), 33);
    };
    const start = setTimeout(() => tick(1), 240);
    return () => {
      clearTimeout(start);
      clearTimeout(to);
    };
  }, [i, items, reduce]);

  useEffect(() => {
    const hold = setTimeout(() => setI((v) => (v + 1) % items.length), 4400);
    return () => clearTimeout(hold);
  }, [i, items.length]);

  return (
    <span className="text-ink-500">
      {prefix}
      <span className="text-ink-600">{items[i].slice(0, n)}</span>
      <span className="ms-0.5 inline-block h-[1.05em] w-[2px] -translate-y-[1px] animate-caret-blink bg-jade-500 align-middle" />
    </span>
  );
}

/** A real, editable prompt box. Persists the idea and routes into the funnel. */
function HeroPrompt() {
  const { t } = useLanguage();
  const h = t.hero;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    const idea = value.trim();
    if (idea) {
      try {
        localStorage.setItem("vq-idea", idea);
      } catch {
        /* ignore */
      }
    }
    setSubmitting(true);
    // Carry the idea through the auth gate: sign up, then the dashboard picks
    // up the saved prompt from localStorage (generation wires in later).
    window.location.href = "/sign-up";
  };

  const showOverlay = !value && !focused;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="glass shadow-glass rounded-2xl p-2.5 text-start"
    >
      <div className="flex items-start gap-3 rounded-xl bg-white/90 p-3.5 ring-1 ring-inset ring-ink-900/[0.07] transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-ink-900/20">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-jade-500/12 text-jade-600">
          <Icon name="Sparkles" className="h-4 w-4" />
        </span>
        <div className="relative flex-1">
          <label htmlFor="vq-idea" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-500">
            {h.promptLabel}
          </label>
          <div className="relative">
            <textarea
              id="vq-idea"
              ref={ref}
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={focused ? h.promptHint : ""}
              className="block w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink-900 outline-none focus:outline-none focus-visible:outline-none placeholder:text-ink-500"
            />
            {showOverlay && (
              <div className="pointer-events-none absolute inset-0 text-[15px] leading-relaxed">
                <CyclingPlaceholder items={h.chips} prefix={h.promptPrefix} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 px-1.5">
        <div className="flex items-center gap-1 text-ink-500">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" aria-hidden="true">
            <Icon name="Mic" className="h-[18px] w-[18px]" />
          </span>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-jade-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-jade-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60"
        >
          <span>{h.send}</span>
          {submitting ? (
            <Icon name="Loader2" className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Icon name="ArrowUp" className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

    </form>
  );
}

function FloatChip({
  icon,
  title,
  sub,
  accent = "jade",
  className,
  float = "animate-float",
}: {
  icon: string;
  title: string;
  sub: string;
  accent?: "jade" | "indigo" | "cyan";
  className?: string;
  float?: string;
}) {
  const ring = { jade: "text-jade-600 bg-jade-500/12", indigo: "text-indigo-600 bg-indigo-500/12", cyan: "text-cyan-600 bg-cyan-500/12" }[accent];
  return (
    <div className={cn("glass shadow-glass flex items-center gap-3 rounded-2xl px-3.5 py-3", float, className)}>
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", ring)}>
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="text-start">
        <span className="block text-[13px] font-bold leading-tight text-ink-900">{title}</span>
        <span className="block text-[11px] leading-tight text-ink-500">{sub}</span>
      </span>
    </div>
  );
}

export function Hero() {
  const { t } = useLanguage();
  const h = t.hero;

  return (
    <section id="top" className="tone-light relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <AnimatedGrid variant="light" className="absolute inset-0 h-full w-full mask-radial opacity-90" />
        <Aurora intensity="soft" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-50" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
        <Parallax speed={0.5} className="absolute left-[4%] top-[32%]">
          <FloatChip icon="CalendarCheck" title="Booking confirmed" sub="Tomorrow · 4:30 PM" accent="jade" />
        </Parallax>
        <Parallax speed={0.32} className="absolute right-[4%] top-[26%]">
          <FloatChip icon="MessageCircle" title="New WhatsApp lead" sub="Replied in 4s" accent="indigo" float="animate-float-slow" />
        </Parallax>
        <Parallax speed={0.4} className="absolute right-[8%] bottom-[14%]">
          <FloatChip icon="TrendingUp" title="+38% bookings" sub="First month" accent="cyan" float="animate-float-slow" />
        </Parallax>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[94vh] max-w-container flex-col items-center justify-center px-5 pb-24 pt-32 text-center sm:px-8 sm:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white/70 px-3.5 py-1.5 text-xs text-ink-700 shadow-soft backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-jade-500" />
          </span>
          <span className="font-mono uppercase tracking-wider">{h.eyebrow}</span>
        </motion.div>

        <h1 className="mt-7 max-w-4xl font-display text-display-lg font-bold leading-[0.95] text-ink-950">
          <WordReveal text={h.title} className="block" trigger="mount" />
          <WordReveal text={h.accent} highlight={h.accent.split(" ")} className="block" delay={0.18} trigger="mount" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
          className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-ink-600 sm:text-lg"
        >
          {h.subtitle}
        </motion.p>

        {/* Trust pills — above the prompt box */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: EASE }}
          className="mt-7 flex flex-wrap items-center justify-center gap-2"
        >
          {h.trust.map((it, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-700 backdrop-blur"
            >
              <Icon name={it.icon} className="h-3.5 w-3.5 text-jade-600" strokeWidth={2.4} />
              {it.text}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.65, duration: 0.8, ease: EASE }}
          className="mt-5 w-full max-w-2xl"
        >
          <HeroPrompt />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.7, ease: EASE }}
          className="mt-7 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
        >
          <Magnetic className="w-full sm:w-auto">
            <a href="/sign-up" className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}>
              {h.build}
              <Icon name="ArrowRight" className="h-[18px] w-[18px] rtl:-scale-x-100" />
            </a>
          </Magnetic>
          <a href="#pricing" className={buttonClasses({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}>
            <Icon name="Phone" className="h-[18px] w-[18px]" />
            {h.call}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
