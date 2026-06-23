"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedGrid } from "@/components/motion/animated-grid";
import { Aurora } from "@/components/motion/aurora";
import { Magnetic } from "@/components/motion/magnetic";
import { WordReveal } from "@/components/motion/word-reveal";
import { Icon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Hero showcase video. Paste a YouTube or Vimeo video ID below to go live; until
 * then a graceful poster placeholder renders in its place. The clip plays as a
 * cinematic background: autoplay, muted, looping, no controls. Reduced-motion
 * visitors always get the still poster instead of a playing video.
 *
 * NEVER put a raw file URL, an embed URL, or any API key here — only the short
 * video ID (e.g. YouTube `dQw4w9WgXcQ`, Vimeo `76979871`).
 */
const HERO_VIDEO: { provider: "youtube" | "vimeo"; id: string } = {
  provider: "youtube",
  id: "", // ← paste the YouTube / Vimeo video ID here
};

function videoEmbedSrc({ provider, id }: { provider: "youtube" | "vimeo"; id: string }): string {
  if (provider === "vimeo") {
    // `background=1` gives Vimeo's chrome-free autoplay-muted-loop player.
    return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1&autopause=0`;
  }
  // youtube-nocookie + a self-referencing playlist is what makes a single clip loop.
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/** The cinematic showcase frame that replaced the prompt box. Renders the live
 *  embed when a video id is set, otherwise an on-brand poster placeholder. */
function HeroVideo() {
  const reduce = useReducedMotion();
  const live = HERO_VIDEO.id.trim().length > 0 && !reduce;

  return (
    <div className="relative w-full max-w-5xl">
      {/* The frame itself — clips the embed to a soft 16:9 rectangle. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[1.75rem] bg-ink-950 shadow-[0_30px_80px_-24px_rgba(2,12,9,0.45)] ring-1 ring-ink-900/10">
        {live ? (
          <iframe
            src={videoEmbedSrc(HERO_VIDEO)}
            title="VibeQuarter product demo"
            className="absolute inset-0 h-full w-full"
            style={{ border: 0 }}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            aria-hidden="true"
          />
        ) : (
          // Poster placeholder — shows until a video id is wired, and for
          // reduced-motion visitors. Dark stage + jade glow + play affordance.
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{ backgroundImage: "radial-gradient(58% 62% at 50% 38%, rgba(16,185,129,0.22), transparent 72%)" }}
              aria-hidden="true"
            />
            <AnimatedGrid variant="dark" className="absolute inset-0 h-full w-full opacity-30 mask-radial" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-jade-500 shadow-lg shadow-jade-500/30">
                <Icon name="Play" className="ms-0.5 h-7 w-7 text-white" strokeWidth={2.4} />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
                Demo reel
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating proof chips — overlay the frame's corners (desktop only). */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <FloatChip
          icon="CalendarCheck"
          title="Booking confirmed"
          sub="Tomorrow · 4:30 PM"
          accent="jade"
          className="absolute -left-7 top-[16%]"
        />
        <FloatChip
          icon="MessageCircle"
          title="New WhatsApp lead"
          sub="Replied in 4s"
          accent="indigo"
          float="animate-float-slow"
          className="absolute -right-7 top-[10%]"
        />
        <FloatChip
          icon="TrendingUp"
          title="+38% bookings"
          sub="First month"
          accent="cyan"
          float="animate-float-slow"
          className="absolute -right-5 -bottom-6"
        />
      </div>
    </div>
  );
}

function FloatChip({
  icon,
  title,
  sub,
  accent = "jade",
  className,
  float = "animate-float",
}: {
  icon: string;
  title: string;
  sub: string;
  accent?: "jade" | "indigo" | "cyan";
  className?: string;
  float?: string;
}) {
  const ring = { jade: "text-jade-600 bg-jade-500/12", indigo: "text-indigo-600 bg-indigo-500/12", cyan: "text-cyan-600 bg-cyan-500/12" }[accent];
  return (
    <div className={cn("glass shadow-glass flex items-center gap-3 rounded-2xl px-3.5 py-3", float, className)}>
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", ring)}>
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="text-start">
        <span className="block text-[13px] font-bold leading-tight text-ink-900">{title}</span>
        <span className="block text-[11px] leading-tight text-ink-500">{sub}</span>
      </span>
    </div>
  );
}

export function Hero() {
  const { t } = useLanguage();
  const h = t.hero;

  return (
    <section id="top" className="tone-light relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <AnimatedGrid variant="light" className="absolute inset-0 h-full w-full mask-radial opacity-90" />
        <Aurora intensity="soft" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-50" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[94vh] max-w-container flex-col items-center justify-center px-5 pb-24 pt-32 text-center sm:px-8 sm:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white/70 px-3.5 py-1.5 text-xs text-ink-700 shadow-soft backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-jade-500" />
          </span>
          <span className="font-mono uppercase tracking-wider">{h.eyebrow}</span>
        </motion.div>

        <h1 className="mt-7 max-w-4xl font-display text-display-lg font-bold leading-[0.95] text-ink-950">
          <WordReveal text={h.title} className="block" trigger="mount" />
          <WordReveal text={h.accent} highlight={h.accent.split(" ")} className="block" delay={0.18} trigger="mount" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
          className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-ink-600 sm:text-lg"
        >
          {h.subtitle}
        </motion.p>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: EASE }}
          className="mt-7 flex flex-wrap items-center justify-center gap-2"
        >
          {h.trust.map((it, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-700 backdrop-blur"
            >
              <Icon name={it.icon} className="h-3.5 w-3.5 text-jade-600" strokeWidth={2.4} />
              {it.text}
            </span>
          ))}
        </motion.div>

        {/* Primary CTAs — promoted above the showcase video so they read first. */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.7, ease: EASE }}
          className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
        >
          <Magnetic className="w-full sm:w-auto">
            <a href="/sign-up" className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}>
              {h.build}
              <Icon name="ArrowRight" className="h-[18px] w-[18px] rtl:-scale-x-100" />
            </a>
          </Magnetic>
          <a href="#pricing" className={buttonClasses({ variant: "secondary", size: "lg", className: "w-full sm:w-auto" })}>
            <Icon name="Phone" className="h-[18px] w-[18px]" />
            {h.call}
          </a>
        </motion.div>

        {/* Showcase video — where the prompt box used to live. */}
        <motion.div
          initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.72, duration: 0.85, ease: EASE }}
          className="mt-12 flex w-full justify-center"
        >
          <HeroVideo />
        </motion.div>
      </div>
    </section>
  );
}
