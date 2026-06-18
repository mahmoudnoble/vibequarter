"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Builder", icon: "Wand2" },
  { href: "/dashboard/seo", label: "SEO & GEO", icon: "Search" },
  { href: "/dashboard/booking", label: "Booking", icon: "CalendarCheck" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
  { href: "/dashboard/leads", label: "Leads", icon: "Users" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex shrink-0 flex-col gap-1 border-b border-border bg-card p-3 md:min-h-screen md:w-60 md:border-b-0 md:border-e">
      <div className="mb-4 hidden px-2 pt-1 md:block">
        <Logo size="sm" />
      </div>

      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {tabs.map((t) => {
          const active = t.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                active ? "bg-jade-500/12 text-jade-700" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon name={t.icon} className="h-[18px] w-[18px]" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden items-center justify-between gap-2 border-t border-border pt-3 md:flex">
        <OrganizationSwitcher
          hidePersonal={false}
          afterSelectOrganizationUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
          appearance={{ variables: { colorPrimary: "#10B981" } }}
        />
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  );
}
