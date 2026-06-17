"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

type RevealVariant = "up" | "blur" | "scale" | "fade" | "left" | "right";

const tagMap = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  article: motion.article,
  span: motion.span,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  ul: motion.ul,
} as const;
type Tag = keyof typeof tagMap;

function build(v: RevealVariant, y: number, x: number): Variants {
  switch (v) {
    case "blur":
      return { hidden: { opacity: 0, y, filter: "blur(12px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } };
    case "scale":
      return { hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1 } };
    case "fade":
      return { hidden: { opacity: 0 }, show: { opacity: 1 } };
    case "left":
      return { hidden: { opacity: 0, x: -x }, show: { opacity: 1, x: 0 } };
    case "right":
      return { hidden: { opacity: 0, x }, show: { opacity: 1, x: 0 } };
    default:
      return { hidden: { opacity: 0, y }, show: { opacity: 1, y: 0 } };
  }
}

/** One-shot scroll reveal. Honors reduced motion (renders plain). */
export function Reveal({
  children,
  className,
  as = "div",
  variant = "up",
  delay = 0,
  duration = 0.6,
  y = 22,
  x = 28,
  once = true,
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  as?: Tag;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  once?: boolean;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const M = tagMap[as] ?? motion.div;
  if (reduce) {
    return <M className={className}>{children}</M>;
  }
  return (
    <M
      className={className}
      variants={build(variant, y, x)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}

/** Orchestrated container — children using <StaggerItem> reveal in sequence. */
export function Stagger({
  children,
  className,
  as = "div",
  stagger = 0.08,
  delayChildren = 0,
  once = true,
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  as?: Tag;
  stagger?: number;
  delayChildren?: number;
  once?: boolean;
  amount?: number;
}) {
  const M = tagMap[as] ?? motion.div;
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren } } };
  return (
    <M className={className} variants={container} initial="hidden" whileInView="show" viewport={{ once, amount }}>
      {children}
    </M>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
  variant = "up",
  duration = 0.6,
  y = 22,
  x = 28,
}: {
  children: React.ReactNode;
  className?: string;
  as?: Tag;
  variant?: RevealVariant;
  duration?: number;
  y?: number;
  x?: number;
}) {
  const reduce = useReducedMotion();
  const M = tagMap[as] ?? motion.div;
  if (reduce) {
    return <M className={className}>{children}</M>;
  }
  const v = build(variant, y, x);
  return (
    <M className={className} variants={{ hidden: v.hidden, show: { ...v.show, transition: { duration, ease: EASE } } }}>
      {children}
    </M>
  );
}
