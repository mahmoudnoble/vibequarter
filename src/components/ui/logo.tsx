import Link from "next/link";
import { cn } from "@/lib/utils";

const markSize = { sm: "h-6 w-6", md: "h-7 w-7", lg: "h-9 w-9" } as const;
const wordSize = { sm: "text-lg", md: "text-xl", lg: "text-[26px]" } as const;

/**
 * VibeQuarter logo — 2×2 tile mark (top-right "quarter" lit jade) + lowercase
 * wordmark. Theme-aware: the dark tiles use the current foreground color.
 */
export function Logo({
  href = "/",
  withWordmark = true,
  size = "md",
  className,
}: {
  href?: string | null;
  withWordmark?: boolean;
  size?: keyof typeof markSize;
  className?: string;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 100 100" className={cn("shrink-0", markSize[size])} role="img" aria-label="VibeQuarter">
        <rect x="6" y="6" width="40" height="40" rx="11" fill="currentColor" />
        <rect x="54" y="6" width="40" height="40" rx="11" fill="#10B981" />
        <rect x="6" y="54" width="40" height="40" rx="11" fill="currentColor" />
        <rect x="54" y="54" width="40" height="40" rx="11" fill="currentColor" />
      </svg>
      {withWordmark && (
        <span className={cn("font-display font-bold lowercase tracking-tight", wordSize[size])}>vibequarter</span>
      )}
    </span>
  );
  if (href === null) return content;
  return (
    <Link href={href} aria-label="VibeQuarter home" className="rounded-md">
      {content}
    </Link>
  );
}
