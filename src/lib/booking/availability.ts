/**
 * Grounded availability engine. The agent may ONLY offer times this module
 * returns — never invented slots. All wall-clock math is done in the clinic's
 * timezone (default Asia/Riyadh) using Intl, so it stays correct without a
 * date library and generalises to any IANA zone.
 */

import type {
  ClinicContext,
  AppointmentRow,
  DayAvailability,
  Slot,
  WorkingHourRow,
} from "./types";

const DAY_MS = 86_400_000;

/** Offset (minutes) of `timeZone` at the instant `at`. */
function offsetMinutes(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) m[p.type] = p.value;
  let hour = m.hour;
  if (hour === "24") hour = "00"; // some engines emit 24 for midnight
  const asUtc = Date.UTC(+m.year, +m.month - 1, +m.day, +hour, +m.minute, +m.second);
  return (asUtc - at.getTime()) / 60000;
}

/** Convert a clinic-local wall-clock time to the matching UTC instant. */
export function zonedWallToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const off = offsetMinutes(timeZone, new Date(guess));
  return new Date(guess - off * 60000);
}

/** Clinic-local calendar date for a UTC instant. */
export function localYmd(at: Date, timeZone: string): { y: number; mo: number; d: number } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) m[p.type] = p.value;
  return { y: +m.year, mo: +m.month, d: +m.day };
}

/** Minutes since clinic-local midnight for a UTC instant. */
export function localMinutes(at: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) m[p.type] = p.value;
  let hour = m.hour;
  if (hour === "24") hour = "00";
  return +hour * 60 + +m.minute;
}

/** Day-of-week (0=Sun..6=Sat) for a clinic-local calendar date. */
export function weekdayOf(y: number, mo: number, d: number): number {
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

export function parseHm(t: string): number {
  const [h, m] = t.split(":");
  return +h * 60 + +m;
}

function overlapsBooked(startMs: number, endMs: number, booked: AppointmentRow[]): boolean {
  return booked.some((a) => startMs < Date.parse(a.ends_at) && endMs > Date.parse(a.starts_at));
}

/**
 * Compute grounded, bookable slots. Walks the booking window day by day in the
 * clinic timezone, steps through each day's working-hour ranges by `durationMin`,
 * and drops slots that are in the past or overlap an existing booked appointment.
 */
export function computeAvailability(opts: {
  ctx: ClinicContext;
  booked: AppointmentRow[];
  durationMin: number;
  now: Date;
  targetDate?: string; // "YYYY-MM-DD"; when set, only that clinic-local day
  maxDays?: number;
  maxSlotsPerDay?: number;
}): DayAvailability[] {
  const { ctx, booked, durationMin, now } = opts;
  const tz = ctx.clinic.timezone || "Asia/Riyadh";
  const windowDays = Math.min(Math.max(ctx.clinic.booking_window_days ?? 14, 1), 90);
  const maxDays = opts.maxDays ?? 4;
  const maxSlots = opts.maxSlotsPerDay ?? 8;

  const hoursByDay = new Map<number, WorkingHourRow[]>();
  for (const h of ctx.hours) {
    const arr = hoursByDay.get(h.weekday) ?? [];
    arr.push(h);
    hoursByDay.set(h.weekday, arr);
  }

  const today = localYmd(now, tz);
  const startDayUtc = Date.UTC(today.y, today.mo - 1, today.d);
  const out: DayAvailability[] = [];

  for (let i = 0; i < windowDays && out.length < maxDays; i++) {
    const day = new Date(startDayUtc + i * DAY_MS);
    const y = day.getUTCFullYear();
    const mo = day.getUTCMonth() + 1;
    const d = day.getUTCDate();
    const ymd = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (opts.targetDate && opts.targetDate !== ymd) continue;

    const weekday = weekdayOf(y, mo, d);
    const ranges = hoursByDay.get(weekday);
    if (!ranges || ranges.length === 0) continue;

    const slots: Slot[] = [];
    for (const r of ranges) {
      const openMin = parseHm(r.open_time);
      const closeMin = parseHm(r.close_time);
      for (let c = openMin; c + durationMin <= closeMin && slots.length < maxSlots; c += durationMin) {
        const h = Math.floor(c / 60);
        const mi = c % 60;
        const startUtc = zonedWallToUtc(y, mo, d, h, mi, tz);
        const endUtc = new Date(startUtc.getTime() + durationMin * 60000);
        const s = startUtc.getTime();
        const e = endUtc.getTime();
        if (s <= now.getTime()) continue;
        if (overlapsBooked(s, e, booked)) continue;
        slots.push({
          start: startUtc.toISOString(),
          end: endUtc.toISOString(),
          label: `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`,
        });
      }
    }
    if (slots.length > 0) out.push({ date: ymd, weekday, slots });
  }

  return out;
}

/**
 * Final guard before insert: confirm a chosen start time is genuinely bookable
 * (future, inside working hours, not overlapping). The DB exclusion constraint
 * is the ultimate race-safe lock; this gives the agent a clean reason to retry.
 */
export function checkSlot(opts: {
  ctx: ClinicContext;
  booked: AppointmentRow[];
  startIso: string;
  durationMin: number;
  now: Date;
}): { ok: boolean; reason?: "invalid" | "past" | "outside_hours" | "overlap"; endIso?: string } {
  const start = new Date(opts.startIso);
  if (Number.isNaN(start.getTime())) return { ok: false, reason: "invalid" };
  const end = new Date(start.getTime() + opts.durationMin * 60000);
  if (start.getTime() <= opts.now.getTime()) return { ok: false, reason: "past" };

  if (overlapsBooked(start.getTime(), end.getTime(), opts.booked)) {
    return { ok: false, reason: "overlap" };
  }

  const tz = opts.ctx.clinic.timezone || "Asia/Riyadh";
  const { y, mo, d } = localYmd(start, tz);
  const weekday = weekdayOf(y, mo, d);
  const ranges = opts.ctx.hours.filter((h) => h.weekday === weekday);
  if (ranges.length === 0) return { ok: false, reason: "outside_hours" };

  const localStart = localMinutes(start, tz);
  const localEnd = localStart + opts.durationMin;
  const within = ranges.some((r) => localStart >= parseHm(r.open_time) && localEnd <= parseHm(r.close_time));
  if (!within) return { ok: false, reason: "outside_hours" };

  return { ok: true, endIso: end.toISOString() };
}
