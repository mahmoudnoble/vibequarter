"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";

export function DashboardSidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { t, locale, toggle } = useLanguage();
  const [open, setOpen] = useState(true);
  const userName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Account";
  const langLabel = locale === "ar" ? t.dashboard.switchToEnglish : t.dashboard.switchToArabic;

  // Super-admins get the cross-clinic console; everyone else sees the clinic tabs.
  const tabs: { href: string; label: string; icon: string }[] = [
    { href: "/dashboard", label: t.dashboard.tabs.overview, icon: "LayoutGrid" },
    ...(isSuperAdmin
      ? [{ href: "/dashboard/admin", label: locale === "ar" ? "العيادات" : "Clinics", icon: "Building2" }]
      : []),
    { href: "/dashboard/booking", label: t.dashboard.tabs.booking, icon: "CalendarCheck" },
    { href: "/dashboard/settings", label: t.dashboard.tabs.settings, icon: "Settings" },
  ];

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-b border-border bg-card",
        "transition-[width] duration-200 ease-in-out",
        "w-full p-2",
        open ? "md:min-h-screen md:w-60 md:p-3" : "md:min-h-screen md:w-[60px] md:p-2",
        "md:border-b-0 md:border-e",
      )}
    >
      {/* Desktop header: hamburger + logo */}
      <div className={cn("mb-2 hidden md:flex md:items-center", open ? "gap-2" : "justify-center")}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t.dashboard.collapse : t.dashboard.expand}
          title={open ? t.dashboard.collapse : t.dashboard.expand}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
        >
          <Icon name="Menu" className="h-5 w-5" />
        </button>
        {open && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <Logo size="sm" />
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {tabs.map((tab) => {
          const active =
            tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href);
          const label = tab.label;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              title={label}
              className={cn(
                "flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                !open && "md:justify-center md:px-0 md:py-2.5",
                active
                  ? "bg-jade-500/12 text-jade-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon name={tab.icon} className="h-[18px] w-[18px] shrink-0" />
              <span className={cn("truncate", !open && "md:hidden")}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: language toggle + avatar + name */}
      <div className="mt-auto hidden flex-col gap-2 border-t border-border pt-3 md:flex">
        <button
          type="button"
          onClick={toggle}
          aria-label={langLabel}
          title={langLabel}
          className={cn(
            "flex min-h-[40px] cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            !open && "md:justify-center md:px-0",
          )}
        >
          <Icon name="Languages" className="h-[18px] w-[18px] shrink-0" />
          <span className={cn(!open && "md:hidden")}>{langLabel}</span>
        </button>

        <div className={cn("flex items-center gap-2.5", !open && "justify-center")}>
          <UserButton afterSignOutUrl="/" appearance={{ variables: { colorPrimary: "#10B981" } }} />
          {open && <span className="truncate text-sm font-medium text-foreground">{userName}</span>}
        </div>
      </div>
    </aside>
  );
}
