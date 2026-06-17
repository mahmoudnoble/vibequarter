"use client";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * Consistent section header: // mono eyebrow + display title (with optional
 * jade accent beat) + supporting paragraph. Tone controls muted text contrast.
 */
export function SectionHeading({
  eyebrow,
  emoji,
  title,
  accent,
  desc,
  align = "center",
  tone = "light",
  accentClassName = "text-jade-accent",
  className,
}: {
  eyebrow?: string;
  emoji?: string;
  title: string;
  accent?: string;
  desc?: string;
  align?: "center" | "start";
  tone?: "light" | "dark" | "jade";
  accentClassName?: string;
  className?: string;
}) {
  const muted = tone === "dark" ? "text-ink-300" : tone === "jade" ? "text-ink-950/75" : "text-ink-600";

  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {(eyebrow || emoji) && (
        <Reveal variant="fade" className={cn("flex items-center gap-2", align === "center" && "justify-center")}>
          {emoji && (
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-jade-500/12 text-base leading-none ring-1 ring-inset ring-jade-500/15" aria-hidden="true">
              {emoji}
            </span>
          )}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        </Reveal>
      )}
      <Reveal variant="blur" as="h2" className="text-balance font-display text-display-sm font-bold">
        {title}
        {accent ? (
          <>
            {" "}
            <span className={accentClassName}>{accent}</span>
          </>
        ) : null}
      </Reveal>
      {desc && (
        <Reveal variant="up" delay={0.05} as="p" className={cn("text-pretty text-base leading-relaxed sm:text-lg", muted)}>
          {desc}
        </Reveal>
      )}
    </div>
  );
}
