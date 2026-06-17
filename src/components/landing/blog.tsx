"use client";

import Image from "next/image";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Icon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/language-provider";

export function Blog() {
  const { t } = useLanguage();
  const b = t.blog;

  return (
    <Section tone="light-pure" id="blog" bg={<div className="bg-grid-sm absolute inset-0 mask-fade-y opacity-40" />}>
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading align="start" emoji={b.emoji} eyebrow={b.eyebrow} title={b.title} accent={b.accent} desc={b.desc} />
        <Reveal variant="up" className="shrink-0">
          <a href="/blog" className={buttonClasses({ variant: "secondary", size: "md" })}>
            {b.cta}
            <Icon name="ArrowRight" className="h-4 w-4 rtl:-scale-x-100" />
          </a>
        </Reveal>
      </div>

      <Stagger className="mt-12 grid gap-5 md:grid-cols-3" stagger={0.08}>
        {b.posts.map((p, i) => (
          <StaggerItem key={i} variant="up" className="h-full">
            <a
              href="/blog"
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative h-44 overflow-hidden">
                <Image src={p.img} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute start-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink-800 backdrop-blur">{p.tag}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-bold leading-snug text-ink-950 transition-colors group-hover:text-jade-700">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{p.excerpt}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-500">{p.read}</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-jade-700">
                    {b.readMore}
                    <Icon name="ArrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" />
                  </span>
                </div>
              </div>
            </a>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
