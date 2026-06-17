"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "./section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

const iconTone: Record<string, string> = {
  jade: "bg-jade-500/12 text-jade-700",
  indigo: "bg-indigo-500/12 text-indigo-700",
  cyan: "bg-cyan-500/12 text-cyan-700",
};

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 64 : -64, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -64 : 64, opacity: 0 }),
};

export function Why() {
  const { t } = useLanguage();
  const w = t.why;
  const items = w.items;
  const n = items.length;
  const reduce = useReducedMotion();
  const [[idx, dir], setState] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);

  const go = (d: number) => setState(([i]) => [(i + d + n) % n, d]);
  const goto = (target: number) => setState(([i]) => [target, target >= i ? 1 : -1]);

  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => setState(([i]) => [(i + 1) % n, 1]), 5200);
    return () => clearInterval(id);
  }, [paused, reduce, n]);

  const item = items[idx];

  return (
    <Section tone="light" id="why" bg={<div className="bg-dots absolute inset-0 mask-fade-y opacity-50" />}>
      <div className="flex justify-center">
        <SectionHeading emoji={w.emoji} eyebrow={w.eyebrow} title={w.title} accent={w.accent} desc={w.desc} className="max-w-2xl" />
      </div>

      <Reveal variant="up" className="mx-auto mt-12 max-w-4xl">
        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="relative overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-card">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={idx}
                custom={dir}
                variants={reduce ? undefined : variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                drag={reduce ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70) go(1);
                  else if (info.offset.x > 70) go(-1);
                }}
                className="grid cursor-grab active:cursor-grabbing md:grid-cols-2"
              >
                <div className="order-2 flex flex-col justify-center gap-4 p-8 md:order-1 md:p-12">
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconTone[item.tone])}>
                    <Icon name={item.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="font-display text-2xl font-bold text-ink-950 sm:text-3xl">{item.title}</h3>
                  <p className="text-pretty text-[15px] leading-relaxed text-ink-600 sm:text-base">{item.body}</p>
                  <span className="font-mono text-xs text-ink-500">
                    {String(idx + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                  </span>
                </div>
                <div className="relative order-1 min-h-[220px] select-none md:order-2 md:min-h-[380px]">
                  <Image src={item.img} alt="" draggable={false} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/20 to-transparent md:bg-gradient-to-l" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 transition-colors hover:bg-ink-50"
            >
              <Icon name="ChevronLeft" className="h-5 w-5 rtl:-scale-x-100" />
            </button>
            <div className="flex items-center gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goto(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn("h-2 rounded-full transition-all", i === idx ? "w-6 bg-jade-600" : "w-2 bg-ink-300 hover:bg-ink-400")}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 transition-colors hover:bg-ink-50"
            >
              <Icon name="ChevronRight" className="h-5 w-5 rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
