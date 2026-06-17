"use client";

import { useActionState } from "react";
import { runWriteTest, type TestResult } from "./actions";
import { buttonClasses } from "@/components/ui/button";

export function WriteTestButton() {
  const [result, action, pending] = useActionState<TestResult | null, FormData>(
    async () => runWriteTest(),
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <button type="submit" disabled={pending} className={buttonClasses({ variant: "primary", size: "sm" })}>
        {pending ? "Running…" : "Run write test (insert a tenant row)"}
      </button>
      {result && (
        <div
          className={
            "rounded-lg border p-3 text-sm " +
            (result.ok
              ? "border-jade-500/40 bg-jade-500/10 text-foreground"
              : "border-red-500/40 bg-red-500/10 text-foreground")
          }
        >
          <span>{result.ok ? "✅ " : "❌ "}{result.message}</span>
          {result.detail && <div className="mt-1 font-mono text-xs text-muted-foreground">{result.detail}</div>}
        </div>
      )}
    </form>
  );
}
