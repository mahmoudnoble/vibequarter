"use client";

import type { CSSProperties } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

/**
 * Infinite marquee. Direction auto-flips in RTL so motion always reads
 * "naturally" for the reader. Pauses on hover. The track is duplicated and the
 * container translated -50% (see keyframes in tailwind.config).
 */
export function Marquee({
  children,
  className,
  itemClassName,
  reverse = false,
  duration = "40s",
  pauseOnHover = true,
}: {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  reverse?: boolean;
  duration?: string;
  pauseOnHover?: boolean;
}) {
  const { locale } = useLanguage();
  const rtl = locale === "ar";
  // XOR: in RTL the default visual direction inverts.
  const useReverse = reverse !== rtl;

  const track = cn(
    "flex shrink-0 items-center",
    useReverse ? "animate-marquee-rev" : "animate-marquee",
    pauseOnHover && "group-hover:[animation-play-state:paused]",
  );

  return (
    <div
      className={cn("group relative flex w-full overflow-hidden mask-fade-x", className)}
      style={{ "--marquee-duration": duration } as CSSProperties}
    >
      <div className={track}>
        <div className={cn("flex shrink-0 items-center", itemClassName)}>{children}</div>
        <div className={cn("flex shrink-0 items-center", itemClassName)} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
