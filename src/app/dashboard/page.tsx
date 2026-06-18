import { buttonClasses } from "@/components/ui/button";
import { PendingIdea } from "./pending-idea";
import { PlanOnboarding } from "./plan-onboarding";
import { BuilderChat } from "./builder-chat";

export const metadata = { title: "Builder" };

export default function BuilderPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8 md:px-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Builder</h1>
          <p className="text-sm text-muted-foreground">Describe your site, edit it by chatting, then publish.</p>
        </div>
        <button type="button" disabled title="Coming soon" className={buttonClasses({ size: "sm", className: "opacity-60" })}>
          Publish
        </button>
      </header>

      <PlanOnboarding />
      <PendingIdea />
      <BuilderChat />
    </div>
  );
}
