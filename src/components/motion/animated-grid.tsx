"use client";

import { useEffect, useRef } from "react";

type Variant = "light" | "dark";

/**
 * Canvas grid with light "beams" that travel along the grid lines (jade / cyan /
 * indigo — the AI signal). Subtle, GPU-light, capped at a handful of beams.
 * Renders a static grid only when prefers-reduced-motion or offscreen.
 */
export function AnimatedGrid({
  className,
  variant = "light",
  cell = 46,
}: {
  className?: string;
  variant?: Variant;
  cell?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const line = variant === "dark" ? "rgba(226,235,245,0.055)" : "rgba(18,26,35,0.05)";
    const palette = ["16,185,129", "18,166,198", "91,91,242"]; // jade, cyan, indigo
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;

    type Beam = { axis: "h" | "v"; pos: number; t: number; speed: number; color: string; len: number };
    let beams: Beam[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (): Beam => {
      const axis: "h" | "v" = Math.random() > 0.5 ? "h" : "v";
      const color = palette[(Math.random() * palette.length) | 0];
      const pos =
        axis === "h"
          ? Math.floor(Math.random() * Math.max(1, h / cell)) * cell
          : Math.floor(Math.random() * Math.max(1, w / cell)) * cell;
      return { axis, pos, t: 0, speed: 0.10 + Math.random() * 0.16, color, len: 120 + Math.random() * 170 };
    };

    const drawGrid = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += cell) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += cell) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();
    };

    const drawBeams = () => {
      for (const b of beams) {
        const span = b.axis === "h" ? w : h;
        const head = b.t * span;
        const tail = Math.max(0, head - b.len);
        const grad =
          b.axis === "h"
            ? ctx.createLinearGradient(tail, b.pos, head, b.pos)
            : ctx.createLinearGradient(b.pos, tail, b.pos, head);
        grad.addColorStop(0, `rgba(${b.color},0)`);
        grad.addColorStop(1, `rgba(${b.color},0.85)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = `rgba(${b.color},0.9)`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        if (b.axis === "h") {
          ctx.moveTo(tail, b.pos + 0.5);
          ctx.lineTo(head, b.pos + 0.5);
        } else {
          ctx.moveTo(b.pos + 0.5, tail);
          ctx.lineTo(b.pos + 0.5, head);
        }
        ctx.stroke();

        ctx.shadowBlur = 16;
        ctx.fillStyle = `rgba(${b.color},0.95)`;
        ctx.beginPath();
        if (b.axis === "h") ctx.arc(head, b.pos + 0.5, 1.7, 0, Math.PI * 2);
        else ctx.arc(b.pos + 0.5, head, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const tick = () => {
      for (const b of beams) b.t += b.speed * 0.016;
      beams = beams.filter((b) => b.t < 1.15);
      if (beams.length < 7 && Math.random() < 0.045) beams.push(spawn());
      drawGrid();
      drawBeams();
      raf = requestAnimationFrame(tick);
    };

    resize();
    if (reduce) {
      drawGrid();
    } else {
      for (let i = 0; i < 4; i++) beams.push(spawn());
      raf = requestAnimationFrame(tick);
    }

    const onResize = () => {
      resize();
      if (reduce) drawGrid();
    };
    window.addEventListener("resize", onResize);

    // Pause the rAF loop when the canvas scrolls out of view.
    const io = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible && !visible && !reduce) {
          visible = true;
          raf = requestAnimationFrame(tick);
        } else if (!nowVisible && visible) {
          visible = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, [variant, cell]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
