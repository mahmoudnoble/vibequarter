import { buttonClasses } from "@/components/ui/button";
import { PendingIdea } from "./pending-idea";
import { PlanOnboarding } from "./plan-onboarding";
import { BuilderChat } from "./builder-chat";
import { BuilderPreview } from "./builder-preview";

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

      {/* Preview pane (desktop / tablet / mobile) */}
      <BuilderPreview />
    </div>
  );
}
