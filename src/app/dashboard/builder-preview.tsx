"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Device = "desktop" | "tablet" | "mobile";

const frameWidth: Record<Device, string> = {
  desktop: "w-full",
  tablet: "w-[768px] max-w-full",
  mobile: "w-[390px] max-w-full",
};
const deviceIcon: Record<Device, string> = { desktop: "Monitor", tablet: "Tablet", mobile: "Smartphone" };

export function BuilderPreview() {
  const [device, setDevice] = useState<Device>("desktop");

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col bg-muted/40 md:min-h-0">
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
        </span>
        <span className="ms-2 hidden truncate rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground sm:inline">
          yoursite.vibequarter.site
        </span>
        <div className="ms-auto flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
          {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              aria-label={`${d} preview`}
              aria-pressed={device === d}
              title={d}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                device === d ? "bg-jade-500/15 text-jade-600" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon name={deviceIcon[d]} className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-auto p-4">
        <div className={cn("flex min-h-[50vh] flex-col rounded-xl border border-border bg-card shadow-sm transition-[width] duration-300", frameWidth[device])}>
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <div>
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-jade-500/12 text-jade-600">
                <Icon name="LayoutTemplate" className="h-6 w-6" />
              </span>
              <p className="font-semibold text-foreground">Your site preview appears here</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Chat on the side to build it — switch desktop / tablet / mobile to check responsiveness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
