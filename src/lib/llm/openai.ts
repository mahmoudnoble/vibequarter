import "server-only";

/**
 * Minimal OpenAI Chat Completions client (raw fetch — no SDK dependency), with
 * tool-calling + optional token streaming. This is the LLM plumbing the booking
 * agent runs on (migrated off Claude). Same shape across WhatsApp + Voice.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export type ToolDef = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ChatResult = { content: string; toolCalls: ToolCall[] };

/**
 * One chat completion. When `onText` is set, the response is streamed and each
 * content delta is forwarded (used by Voice so TTS starts speaking immediately);
 * tool-call rounds emit no content, so deltas only fire on the final reply.
 */
export async function chatCompletion(opts: {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDef[];
  maxTokens?: number;
  temperature?: number;
  onText?: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<ChatResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const stream = Boolean(opts.onText);
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    max_tokens: opts.maxTokens ?? 1024,
  };
  if (opts.tools?.length) {
    body.tools = opts.tools;
    // Booking is sequential: the model must see each tool's result before the
    // next call (e.g. book the new time, THEN cancel the old). Parallel calls in
    // one turn would race the shared appointment list.
    body.parallel_tool_calls = false;
  }
  if (opts.temperature != null) body.temperature = opts.temperature;
  if (stream) body.stream = true;

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`);
  }

  if (!stream) {
    const j = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null; tool_calls?: ToolCall[] } }>;
    };
    const msg = j.choices?.[0]?.message ?? {};
    return { content: msg.content ?? "", toolCalls: msg.tool_calls ?? [] };
  }

  // Streaming: parse SSE; accumulate content (fire onText) and tool_calls (by index).
  if (!res.body) return { content: "", toolCalls: [] };
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let content = "";
  const toolAcc = new Map<number, { id: string; name: string; args: string }>();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith("data:")) continue;
      const data = s.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let d: {
        choices?: Array<{
          delta?: {
            content?: string;
            tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }>;
          };
        }>;
      };
      try {
        d = JSON.parse(data);
      } catch {
        continue;
      }
      const delta = d.choices?.[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        content += delta.content;
        opts.onText!(delta.content);
      }
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          const cur = toolAcc.get(idx) ?? { id: "", name: "", args: "" };
          if (tc.id) cur.id = tc.id;
          if (tc.function?.name) cur.name = tc.function.name;
          if (tc.function?.arguments) cur.args += tc.function.arguments;
          toolAcc.set(idx, cur);
        }
      }
    }
  }

  const toolCalls: ToolCall[] = [...toolAcc.entries()]
    .sort((a, b) => a[0] - b[0])
    .filter(([, t]) => t.name)
    .map(([, t]) => ({ id: t.id, type: "function" as const, function: { name: t.name, arguments: t.args || "{}" } }));

  return { content, toolCalls };
}
