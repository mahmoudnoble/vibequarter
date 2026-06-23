import { cn } from "@/lib/utils";

/**
 * The brand Card primitive: white/elevated surface, hairline border, soft
 * slate-tinted shadow; interactive cards lift on hover. Extracted so the
 * dashboard and generated sites stop re-declaring the same classes.
 */
export function Card({
  children,
  className,
  interactive = false,
  as: Tag = "div",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  /** Adds hover lift + pointer cursor for clickable cards. */
  interactive?: boolean;
  as?: React.ElementType;
  style?: React.CSSProperties;
}) {
  return (
    <Tag
      // `--card-radius` lets a generated-site template set its own roundness;
      // it defaults to 1.25rem (the project's rounded-2xl = 20px) when unset.
      style={{ borderRadius: "var(--card-radius, 1.25rem)", ...style }}
      className={cn(
        "border border-border bg-card text-card-foreground shadow-sm",
        interactive &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
