import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export const metadata = { title: "Overview" };

const tools = [
  {
    href: "/dashboard/booking",
    icon: "CalendarCheck",
    title: "Booking agent",
    desc: "An AI agent that turns chats into booked appointments — over WhatsApp.",
  },
  {
    href: "/dashboard/seo",
    icon: "Search",
    title: "SEO & GEO",
    desc: "Get found on Google and inside AI answers — keywords & articles.",
  },
  {
    href: "/dashboard/leads",
    icon: "Users",
    title: "Reviews & leads",
    desc: "Grow your Google reviews and see where patients come from.",
  },
  {
    href: "/dashboard/settings",
    icon: "Settings",
    title: "Settings",
    desc: "Your clinic details, workspace, and plan.",
  },
] as const;

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything to grow your clinic — booking, reviews, and getting found online.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-jade-500/40 hover:bg-jade-500/5"
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-jade-500/12 text-jade-600">
              <Icon name={tool.icon} className="h-5 w-5" />
            </span>
            <h2 className="font-display font-semibold text-foreground">{tool.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tool.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
