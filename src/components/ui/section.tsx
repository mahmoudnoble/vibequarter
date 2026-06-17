import { cn } from "@/lib/utils";

type Tone = "light" | "light-pure" | "dark" | "dark-bare" | "jade";

const toneClass: Record<Tone, string> = {
  light: "tone-light",
  "light-pure": "tone-light-pure",
  dark: "tone-dark",
  "dark-bare": "tone-dark-bare",
  jade: "tone-jade",
};

/**
 * Editorial section wrapper. Sets a FIXED tone (bg + base text + the --grid
 * pattern color the .bg-grid/.bg-dots utilities consume). The landing
 * alternates tones for a deliberate dark/light rhythm — not a user theme.
 */
export function Section({
  children,
  tone = "light",
  id,
  className,
  containerClassName,
  full = false,
  bg,
}: {
  children: React.ReactNode;
  tone?: Tone;
  id?: string;
  className?: string;
  containerClassName?: string;
  /** Render children edge-to-edge (no centered container). */
  full?: boolean;
  /** Full-bleed decorative layer rendered behind the content (grid, aurora…). */
  bg?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative isolate overflow-hidden",
        toneClass[tone],
        "py-20 sm:py-28 lg:py-32",
        className,
      )}
    >
      {bg ? <div className="pointer-events-none absolute inset-0 z-0">{bg}</div> : null}
      {full ? (
        children
      ) : (
        <div className={cn("relative z-10 mx-auto w-full px-5 sm:px-8", containerClassName || "max-w-container")}>
          {children}
        </div>
      )}
    </section>
  );
}
