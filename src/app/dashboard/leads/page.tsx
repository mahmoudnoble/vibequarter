import { Icon } from "@/components/ui/icon";

export const metadata = { title: "Leads" };

const items = [
  { icon: "Users", title: "See who visited", desc: "Identify the companies browsing your site." },
  { icon: "TrendingUp", title: "Intent score", desc: "Rank visitors by interest — viewed pricing/booking, repeat visits." },
  { icon: "MessageCircle", title: "Hot-lead alerts", desc: "Get a WhatsApp ping when a high-intent visitor lands." },
  { icon: "Sparkles", title: "1-click outreach draft", desc: "An AI-drafted message you approve before sending." },
];

export default function LeadsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Turn site visitors into booked leads — our take on account-based marketing.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-jade-500/12 text-jade-600">
              <Icon name={it.icon} className="h-[18px] w-[18px]" />
            </span>
            <h2 className="font-semibold text-foreground">{it.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        ✨ Activates once your site is live and receiving visitors.
      </p>
    </div>
  );
}
