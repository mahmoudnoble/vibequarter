import { runEndOfDayAutoCancel } from "@/lib/booking/auto-cancel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * End-of-day auto-cancel job. Triggered by Vercel Cron (which sends
 * `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set). Manual runs
 * must carry the same header. Returns a small JSON summary.
 */
async function handle(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("CRON_SECRET not configured", { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await runEndOfDayAutoCancel();
  console.log("[cron] end-of-day", JSON.stringify(result));
  return Response.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
