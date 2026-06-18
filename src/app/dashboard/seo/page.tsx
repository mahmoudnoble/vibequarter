import { Icon } from "@/components/ui/icon";

export const metadata = { title: "SEO & GEO" };

const seoTools = [
  "Meta title & description with a live Google preview",
  "Social share image (Open Graph) + favicon",
  "Automatic sitemap, robots.txt & canonical URLs",
  "Per-blog-post SEO",
  "SEO health score with one-click fixes",
];

const geoTools = [
  "One-click “Optimize for AI search” (schema + llms.txt + AI-crawler access)",
  "Auto JSON-LD structured data (LocalBusiness, Service, FAQ)",
  "FAQ builder that AI engines love to cite",
  "GEO score + AI-citation tracking (ChatGPT / Perplexity)",
];

function ToolCard({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-jade-500/12 text-jade-600">
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
        <h2 className="font-display font-semibold text-foreground">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-jade-500" strokeWidth={2.4} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SeoPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
      <h1 className="font-display text-2xl font-bold text-foreground">SEO &amp; GEO</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Get found on Google — and inside AI answers (ChatGPT, Perplexity, Gemini).
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <ToolCard title="SEO tools" icon="Search" items={seoTools} />
        <ToolCard title="GEO — AI visibility" icon="Sparkles" items={geoTools} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-jade-500/12 text-jade-600">
            <Icon name="PencilRuler" className="h-[18px] w-[18px]" />
          </span>
          <h2 className="font-display font-semibold text-foreground">Blog builder</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">Write &amp; publish posts that rank — the full flow, in one place:</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            "Write the post (with AI assist)",
            "Choose a thumbnail / cover image",
            "Per-post SEO: title, description, slug, social image",
            "Auto Article structured data + sitemap entry",
          ].map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-jade-500" strokeWidth={2.4} />
              {it}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        ✨ These activate once you publish your first site — most run automatically from your business details.
      </p>
    </div>
  );
}
