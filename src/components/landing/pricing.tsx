"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "./section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { Aurora } from "@/components/motion/aurora";
import { Icon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

const planIcon: Record<string, string> = { starter: "Sparkles", pro: "Zap", dfy: "Rocket" };

export function Pricing() {
  const { t } = useLanguage();
  const p = t.pricing;
  const [yearly, setYearly] = useState(false);

  return (
    <Section
      tone="dark"
      id="pricing"
      containerClassName="max-w-container-xl"
      bg={
        <>
          <div className="bg-grid absolute inset-0 mask-fade-y opacity-40" />
          <Aurora intensity="soft" />
        </>
      }
    >
      <div className="flex flex-col items-center">
        <SectionHeading tone="dark" emoji={p.emoji} eyebrow={p.eyebrow} title={p.title} accent={p.accent} desc={p.desc} className="max-w-2xl" />

        {/* Billing toggle */}
        <Reveal variant="up" className="mt-8">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={cn("relative rounded-full px-4 py-2 text-sm font-semibold transition-colors", yearly ? "text-ink-300 hover:text-white" : "text-ink-950")}
            >
              {!yearly && <motion.span layoutId="billPill" className="absolute inset-0 rounded-full bg-jade-500" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">{p.billing.monthly}</span>
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={cn("relative rounded-full px-4 py-2 text-sm font-semibold transition-colors", yearly ? "text-ink-950" : "text-ink-300 hover:text-white")}
            >
              {yearly && <motion.span layoutId="billPill" className="absolute inset-0 rounded-full bg-jade-500" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative flex items-center gap-1.5">
                {p.billing.yearly}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", yearly ? "bg-ink-950/15 text-ink-950" : "bg-jade-500/20 text-jade-300")}>
                  {p.billing.save}
                </span>
              </span>
            </button>
          </div>
        </Reveal>
      </div>

      <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
        {p.plans.map((plan, i) => {
          const price = yearly ? plan.priceYearly : plan.price;
          const showCadence = plan.cadence && plan.id !== "dfy";
          return (
            <Reveal key={plan.id} variant="up" delay={i * 0.08} className={cn("h-full", plan.featured && "lg:-my-4")}>
              <div
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-2xl p-7",
                  plan.featured ? "bg-white text-ink-900 shadow-brand-lg ring-1 ring-jade-500/40" : "glass-dark text-white",
                )}
              >
                {plan.featured && <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-jade-500/25 blur-3xl" />}
                {plan.featured && (
                  <span className="absolute end-6 top-7 inline-flex items-center gap-1 rounded-full bg-jade-500 px-2.5 py-1 text-[11px] font-bold text-ink-950">
                    <Icon name="Star" className="h-3 w-3" strokeWidth={2.6} />
                    {p.popular}
                  </span>
                )}

                <div className="flex items-center gap-2.5">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-jade-500/15", plan.featured ? "text-jade-600" : "text-jade-300")}>
                    <Icon name={planIcon[plan.id] ?? "Sparkles"} className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className={cn("font-display text-lg font-bold", plan.featured ? "text-ink-900" : "text-white")}>{plan.name}</h3>
                </div>

                <div className="mt-5 flex items-end gap-1">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={price}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="font-display text-4xl font-bold tracking-tight"
                    >
                      {price}
                    </motion.span>
                  </AnimatePresence>
                  {showCadence && <span className={cn("pb-1 text-sm", plan.featured ? "text-ink-500" : "text-ink-400")}>{plan.cadence}</span>}
                </div>
                <div className={cn("mt-1 h-4 text-[11px]", plan.featured ? "text-ink-500" : "text-ink-400")}>
                  {yearly && plan.id === "pro" ? p.billedAnnually : plan.id === "starter" ? p.forever : ""}
                </div>

                <p className={cn("mt-3 text-sm leading-relaxed", plan.featured ? "text-ink-600" : "text-ink-300")}>{plan.blurb}</p>

                <div className={cn("my-6 h-px", plan.featured ? "bg-ink-100" : "bg-white/10")} />

                <ul className="space-y-3">
                  {plan.features.map((ft, k) => (
                    <li key={k} className="flex items-start gap-2.5 text-sm">
                      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-jade-500/15", plan.featured ? "text-jade-600" : "text-jade-300")}>
                        <Icon name="Check" className="h-3.5 w-3.5" strokeWidth={2.6} />
                      </span>
                      <span className={plan.featured ? "text-ink-700" : "text-ink-200"}>{ft}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  {plan.featured ? (
                    <Magnetic className="w-full">
                      <a href="#top" className={buttonClasses({ size: "md", className: "w-full" })}>
                        {plan.cta}
                        <Icon name="ArrowRight" className="h-4 w-4 rtl:-scale-x-100" />
                      </a>
                    </Magnetic>
                  ) : (
                    <a href="#top" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 font-semibold text-white transition-colors hover:bg-white/10">
                      {plan.cta}
                      <Icon name="ArrowRight" className="h-4 w-4 rtl:-scale-x-100" />
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
