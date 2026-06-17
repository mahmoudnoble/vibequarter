"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 3D tilt toward the cursor with a moving specular glare. Children can use
 * `translateZ`/`[transform:translateZ(..)]` for depth since transform-style is
 * preserve-3d. Static (plain div) under reduced motion.
 */
export function TiltCard({
  children,
  className,
  max = 9,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 150, damping: 18, mass: 0.3 });
  const sy = useSpring(py, { stiffness: 150, damping: 18, mass: 0.3 });
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const gx = useTransform(sx, [0, 1], ["0%", "100%"]);
  const gy = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.22), transparent 55%)`;

  if (reduce) return <div className={cn(className)}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        px.set(0.5);
        py.set(0.5);
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 1000 }}
      className={cn("relative will-change-transform", className)}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{ background: glareBg, opacity: hover ? 1 : 0 }}
        />
      )}
    </motion.div>
  );
}
