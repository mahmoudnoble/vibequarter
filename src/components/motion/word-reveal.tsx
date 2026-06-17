"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Per-word "rise from below" reveal for big display headings. Each word sits in
 * an overflow-hidden mask and slides up. Words listed in `highlight` (exact
 * match) get the jade accent. Honors reduced motion.
 */
export function WordReveal({
  text,
  className,
  highlight = [],
  delay = 0,
  stagger = 0.055,
  duration = 0.7,
  once = true,
  trigger = "inView",
}: {
  text: string;
  className?: string;
  highlight?: string[];
  delay?: number;
  stagger?: number;
  duration?: number;
  once?: boolean;
  /** "mount" plays immediately on load (use for above-the-fold heroes). */
  trigger?: "inView" | "mount";
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const hi = new Set(highlight);

  if (reduce) {
    return (
      <span className={className}>
        {words.map((w, i) => (
          <span key={i} className={cn(hi.has(w) && "text-jade-accent")}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom leading-[0.95]" aria-hidden="true">
          <motion.span
            className={cn("inline-block", hi.has(w) && "text-jade-accent")}
            initial={{ y: "115%" }}
            {...(trigger === "mount" ? { animate: { y: "0%" } } : { whileInView: { y: "0%" }, viewport: { once } })}
            transition={{ duration, ease: EASE, delay: delay + i * stagger }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
