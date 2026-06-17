"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Magnetic hover: the wrapped element drifts toward the cursor while hovered and
 * springs back on leave. Pointer-only flourish; disabled under reduced motion.
 */
export function Magnetic({
  children,
  className,
  strength = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  if (reduce) return <div className={cn("inline-flex", className)}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={cn("inline-flex", className)}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
