"use client";

import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { Footer } from "@/components/landing/footer";
import { useLanguage } from "@/components/i18n/language-provider";

export default function BlogPage() {
  const { t, locale } = useLanguage();
  const b = t.blog;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-container-xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Logo size="sm" />
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900">
            <Icon name="ArrowLeft" className="h-4 w-4 rtl:-scale-x-100" />
            {locale === "ar" ? "العودة للموقع" : "Back to site"}
          </Link>
        </div>
      </header>

      <main className="tone-light min-h-[72vh]">
        <div className="mx-auto max-w-container-xl px-5 py-16 sm:px-8 sm:py-20">
          <span className="eyebrow">{b.eyebrow}</span>
          <h1 className="mt-4 text-balance font-display text-display-sm font-bold text-ink-950">
            {b.title} <span className="text-jade-accent">{b.accent}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-ink-600">{b.desc}</p>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {b.posts.map((p, i) => (
              <article key={i} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative h-44 overflow-hidden">
                  <Image src={p.img} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute start-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink-800 backdrop-blur">{p.tag}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-lg font-bold leading-snug text-ink-950">{p.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{p.excerpt}</p>
                  <span className="mt-4 font-mono text-xs text-ink-500">{p.read}</span>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-12 text-sm text-ink-500">{locale === "ar" ? "المزيد من المقالات قريباً." : "More posts coming soon."}</p>
        </div>
      </main>

      <Footer />
    </>
  );
}
