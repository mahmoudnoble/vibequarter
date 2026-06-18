"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string };

export function BuilderChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [value, setValue] = useState("");

  const send = () => {
    const text = value.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      {
        role: "assistant",
        text: "Got it — your request is saved ✓. The AI builder connects once the generation engine is enabled; then I'll build the site in the preview and you can edit it here, then hit Publish.",
      },
    ]);
    setValue("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-[40vh] flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[35vh] flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-jade-500/12 text-jade-600">
              <Icon name="Wand2" className="h-5 w-5" />
            </span>
            <p className="font-semibold text-foreground">Describe your business</p>
            <p className="mt-1 text-sm text-muted-foreground">e.g. &ldquo;A booking site for my dental clinic in Dubai.&rdquo;</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                  m.role === "user" ? "bg-jade-600 text-white" : "border border-border bg-muted text-foreground",
                )}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Describe or edit your site…"
          className="min-h-[44px] flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="submit" className={buttonClasses({ size: "md" })} aria-label="Send">
          <Icon name="ArrowUp" className="h-[18px] w-[18px]" />
        </button>
      </form>
    </div>
  );
}
