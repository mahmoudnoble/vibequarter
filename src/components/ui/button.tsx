import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold " +
  "transition-all duration-200 ease-out select-none cursor-pointer " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-jade-600 text-white hover:bg-jade-700 hover:shadow-brand hover:-translate-y-0.5 active:translate-y-0",
  secondary: "border border-border bg-card text-foreground hover:bg-muted hover:-translate-y-0.5 active:translate-y-0",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-13 px-7 text-base [height:3.25rem]",
};

export function buttonClasses(opts?: { variant?: Variant; size?: Size; className?: string }): string {
  const { variant = "primary", size = "md", className } = opts ?? {};
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />;
}
