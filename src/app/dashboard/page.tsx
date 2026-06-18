import { buttonClasses } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PendingIdea } from "./pending-idea";
import { PlanOnboarding } from "./plan-onboarding";
import { BuilderChat } from "./builder-chat";

export const metadata = { title: "Builder" };

export default function BuilderPage() {
  return (
    <div className="flex flex-col md:h-screen md:flex-row">
      {/* Chat pane */}
      <div className="flex w-full flex-col border-b border-border bg-card md:w-[400px] md:shrink-0 md:border-b-0 md:border-e">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Builder</h1>
            <p className="text-xs text-muted-foreground">Chat to build &amp; edit your site</p>
          </div>
          <button type="button" disabled title="Coming soon" className={buttonClasses({ size: "sm", className: "opacity-60" })}>
            Publish
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pt-4 empty:hidden">
            <PlanOnboarding />
            <PendingIdea />
          </div>
          <BuilderChat />
        </div>
      </div>

      {/* Preview pane */}
      <div className="flex min-h-[60vh] flex-1 flex-col bg-muted/40 md:min-h-0">
        <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
          </span>
          <span className="ms-2 truncate rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
            yoursite.vibequarter.site
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div>
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-jade-500/12 text-jade-600">
              <Icon name="LayoutTemplate" className="h-6 w-6" />
            </span>
            <p className="font-semibold text-foreground">Your site preview appears here</p>
            <p className="mt-1 text-sm text-muted-foreground">Start chatting on the side — we&apos;ll build it live, then you publish.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
