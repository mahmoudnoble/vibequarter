"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Types `text` out character by character (once, when it mounts / changes).
 * Reserves the full width up-front with an invisible copy so the surrounding
 * pill never reflows while typing, and shows a blinking caret. Respects
 * prefers-reduced-motion (renders the full text instantly).
 */
export function Typewriter({
  text,
  className,
  speed = 42,
  startDelay = 350,
}: {
  text: string;
  className?: string;
  speed?: number;
  startDelay?: number;
}) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let next: ReturnType<typeof setTimeout>;
    const start = setTimeout(function tick(i = 1) {
      setCount(i);
      if (i < text.length) next = setTimeout(() => tick(i + 1), speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearTimeout(next);
    };
  }, [text, reduce, speed, startDelay]);

  const done = count >= text.length;

  return (
    <span className={`relative inline-block align-middle ${className ?? ""}`} aria-label={text}>
      {/* invisible full copy reserves the final width — no layout shift */}
      <span className="invisible" aria-hidden="true">
        {text}
      </span>
      <span className="absolute inset-0 whitespace-nowrap" aria-hidden="true">
        {text.slice(0, count)}
        <span
          className={`ms-px inline-block h-3.5 w-[1.5px] translate-y-[3px] bg-current ${
            done ? "animate-caret-blink" : ""
          }`}
        />
      </span>
    </span>
  );
}
