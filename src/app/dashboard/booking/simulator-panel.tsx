"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import { sendBookingMessage, resetSimulator } from "./booking-actions";
import type { AppointmentFull, AppointmentView, ServiceView } from "@/lib/booking/types";

type ChatMessage = { id: string; role: "user" | "assistant" | "system"; content: string };

function toAppointmentViews(appts: AppointmentFull[]): AppointmentView[] {
  const now = new Date().toISOString();
  return appts
    .filter((a) => a.status === "booked" && a.startIso >= now)
    .sort((a, b) => a.startIso.localeCompare(b.startIso))
    .slice(0, 30)
    .map((a) => ({
      id: a.id,
      patientName: a.patientName,
      serviceNameEn: a.serviceNameEn,
      serviceNameAr: a.serviceNameAr,
      startIso: a.startIso,
      endIso: a.endIso,
    }));
}

export function SimulatorPanel({
  clinicName,
  timezone,
  services,
  allAppointments,
  onAppointmentsChange,
}: {
  clinicName: string;
  timezone: string;
  services: ServiceView[];
  allAppointments: AppointmentFull[];
  onAppointmentsChange: (updated: AppointmentFull[]) => void;
}) {
  const { t, locale } = useLanguage();
  const tb = t.dashboard.booking;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const appointments = toAppointmentViews(allAppointments);

  const idRef = useRef(0);
  const nextId = () => String(++idRef.current);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const fmt = (iso: string) => dateFmt.format(new Date(iso));
  const serviceName = (s: ServiceView) => (locale === "ar" ? s.nameAr : s.nameEn);
  const apptService = (a: AppointmentView) =>
    locale === "ar" ? a.serviceNameAr : a.serviceNameEn;

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { id: nextId(), role: "user", content };
    const transcript = [...messages, userMsg]
      .filter((m) => m.role !== "system")
      .map(({ role, content }) => ({ role: role as "user" | "assistant", content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendBookingMessage({ turns: transcript, locale });
      const reply = res.ok && res.reply ? res.reply : tb.errorReply;
      setMessages((prev) => {
        const out = [...prev, { id: nextId(), role: "assistant" as const, content: reply }];
        if (res.booked) out.push({ id: nextId(), role: "system" as const, content: tb.bookedNote });
        return out;
      });
      if (res.appointments) {
        // merge back into allAppointments (new booked appointments)
        const existing = new Set(allAppointments.map((a) => a.id));
        const fresh = res.appointments
          .filter((a) => !existing.has(a.id))
          .map(
            (a): AppointmentFull => ({
              id: a.id,
              patientName: a.patientName,
              patientPhone: null,
              serviceNameEn: a.serviceNameEn,
              serviceNameAr: a.serviceNameAr,
              startIso: a.startIso,
              endIso: a.endIso,
              status: "booked",
              source: "simulator",
            }),
          );
        if (fresh.length > 0) onAppointmentsChange([...allAppointments, ...fresh]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: tb.errorReply },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function reset() {
    if (loading) return;
    if (typeof window !== "undefined" && !window.confirm(tb.resetConfirm)) return;
    setLoading(true);
    try {
      await resetSimulator();
      onAppointmentsChange([]);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 py-2 lg:grid-cols-5">
      {/* Chat simulator */}
      <section className="lg:col-span-3">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">{tb.tryTitle}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{tb.tryHint}</p>
          </div>
        </div>

        <div className="flex h-[540px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Agent header */}
          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-jade-500/12 text-jade-600">
              <Icon name="Bot" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {clinicName.trim() || tb.agentName}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-500/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-jade-500" />
                </span>
                {tb.agentStatus}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              title={tb.reset}
              aria-label={tb.reset}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="RotateCcw" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tb.reset}</span>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-4 py-4"
          >
            {messages.length === 0 && !loading ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-jade-500/12 text-jade-600">
                  <Icon name="MessageCircle" className="h-6 w-6" />
                </span>
                <p className="font-semibold text-foreground">{tb.emptyTitle}</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">{tb.emptyHint}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {tb.starters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-jade-500/40 hover:bg-jade-500/8"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) =>
                m.role === "system" ? (
                  <div key={m.id} className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-jade-500/12 px-3 py-1 text-xs font-semibold text-jade-700">
                      <Icon name="CheckCircle2" className="h-3.5 w-3.5" />
                      {m.content}
                    </span>
                  </div>
                ) : (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-2",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {m.role === "assistant" && (
                      <span className="mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-jade-500/12 text-jade-600">
                        <Icon name="Bot" className="h-4 w-4" />
                      </span>
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-jade-500 text-white"
                          : "border border-border bg-card text-foreground",
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ),
              )
            )}

            {loading && (
              <div className="flex justify-start gap-2">
                <span className="mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-jade-500/12 text-jade-600">
                  <Icon name="Bot" className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-3.5 py-3">
                  <Dot delay="0ms" />
                  <Dot delay="150ms" />
                  <Dot delay="300ms" />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tb.inputPlaceholder}
              aria-label={tb.inputPlaceholder}
              disabled={loading}
              className="min-h-[44px] flex-1 rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-jade-500/50 focus:ring-2 focus:ring-jade-500/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={tb.send}
              title={tb.send}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-jade-500 text-white transition-colors hover:bg-jade-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="Send" className="h-[18px] w-[18px]" />
            </button>
          </form>
        </div>
      </section>

      {/* Info rail: services + upcoming */}
      <aside className="space-y-5 lg:col-span-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <Icon name="Stethoscope" className="h-4 w-4 text-jade-600" />
            {tb.servicesTitle}
          </h2>
          <ul className="space-y-2">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{serviceName(s)}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.durationMin} {tb.durationUnit}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-jade-700">
                  {s.price == null ? tb.priceOnRequest : `${s.price} ${tb.priceUnit}`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <Icon name="CalendarClock" className="h-4 w-4 text-jade-600" />
            {tb.upcomingTitle}
            {appointments.length > 0 && (
              <span className="ms-auto rounded-full bg-jade-500/12 px-2 py-0.5 text-xs font-bold text-jade-700">
                {appointments.length}
              </span>
            )}
          </h2>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tb.upcomingEmpty}</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((a) => (
                <li key={a.id} className="rounded-xl border border-border/70 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {a.patientName}
                    </p>
                    <span className="shrink-0 text-xs font-medium text-jade-700">
                      {fmt(a.startIso)}
                    </span>
                  </div>
                  {apptService(a) && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {apptService(a)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
      style={{ animationDelay: delay }}
    />
  );
}
