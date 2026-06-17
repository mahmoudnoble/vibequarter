"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Translates its content on the Y axis as the section scrolls through the
 * viewport. `speed` is the fraction of the element's height it drifts each way
 * (e.g. 0.2 → +20%…-20%). Static under reduced motion.
 */
export function Parallax({
  children,
  className,
  speed = 0.18,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);

  return (
    <motion.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}
