"use client";

import { useEffect, useState } from "react";

/**
 * Surfaces the idea the visitor typed in the hero before signing up. The hero
 * stashes it in localStorage ("vq-idea") and routes through sign-up; here we
 * read it back so the prompt survives the auth gate. Generation wires in later.
 */
export function PendingIdea() {
  const [idea, setIdea] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("vq-idea");
      if (v && v.trim()) setIdea(v.trim());
    } catch {
      /* ignore */
    }
  }, []);

  if (!idea) return null;

  return (
    <section className="mb-6 rounded-xl border border-jade-500/30 bg-jade-500/[0.06] p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-jade-600">// your site request</span>
        <span className="inline-flex items-center rounded-full bg-jade-500/15 px-2.5 py-0.5 text-xs font-semibold text-jade-700">
          Queued
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground">&ldquo;{idea}&rdquo;</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Saved — we&rsquo;ll build this for you. (Generation starts once the AI engine is connected.)
      </p>
    </section>
  );
}
