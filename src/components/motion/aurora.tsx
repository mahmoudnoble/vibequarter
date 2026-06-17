"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Intensity = "soft" | "medium" | "strong";

const blobs = [
  { c: "bg-jade-500", pos: "left-[-12%] top-[-14%] h-[40rem] w-[40rem]", x: ["-8%", "6%", "-8%"], y: ["-6%", "8%", "-6%"], d: 19 },
  { c: "bg-indigo-500", pos: "right-[-10%] top-[8%] h-[34rem] w-[34rem]", x: ["8%", "-7%", "8%"], y: ["5%", "-6%", "5%"], d: 23 },
  { c: "bg-cyan-500", pos: "left-[24%] bottom-[-16%] h-[30rem] w-[30rem]", x: ["-6%", "8%", "-6%"], y: ["7%", "-5%", "7%"], d: 27 },
];

/**
 * The brand signature: a soft, slowly drifting jade→indigo→cyan aurora glow.
 * Decorative only; pointer-events disabled. Static under reduced motion.
 */
export function Aurora({
  className,
  intensity = "medium",
}: {
  className?: string;
  intensity?: Intensity;
}) {
  const reduce = useReducedMotion();
  const op = intensity === "strong" ? 0.5 : intensity === "soft" ? 0.22 : 0.34;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {blobs.map((b, i) =>
        reduce ? (
          <div key={i} className={cn("absolute rounded-full blur-[90px]", b.c, b.pos)} style={{ opacity: op }} />
        ) : (
          <motion.div
            key={i}
            className={cn("absolute rounded-full blur-[90px]", b.c, b.pos)}
            style={{ opacity: op }}
            animate={{ x: b.x, y: b.y, scale: [1, 1.12, 1] }}
            transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }}
          />
        ),
      )}
    </div>
  );
}
