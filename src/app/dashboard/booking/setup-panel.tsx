"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  saveClinicInfoAction,
  saveServiceAction,
  deleteServiceAction,
  saveWorkingHoursAction,
} from "./booking-actions";
import type { ServiceView, WorkingHourInput } from "@/lib/booking/types";

type ServiceDraft = {
  id?: string;
  name_en: string;
  name_ar: string;
  duration_min: number;
  price: string;
};

const EMPTY_DRAFT: ServiceDraft = { name_en: "", name_ar: "", duration_min: 30, price: "" };

export function SetupPanel({
  clinicId: _clinicId,
  clinicName: initName,
  waPnId: initWaPnId,
  services: initServices,
  workingHours: initHours,
}: {
  clinicId: string;
  clinicName: string;
  waPnId: string | null;
  services: ServiceView[];
  workingHours: WorkingHourInput[];
}) {
  const { t, locale } = useLanguage();
  const st = t.dashboard.booking.setupTab;

  // ── Clinic info ────────────────────────────────────────────────────────────
  const [name, setName] = useState(initName);
  const [waPnId, setWaPnId] = useState(initWaPnId ?? "");
  const [infoState, setInfoState] = useState<"idle" | "saving" | "saved">("idle");
  const [, infoTransition] = useTransition();

  function saveInfo() {
    setInfoState("saving");
    infoTransition(async () => {
      await saveClinicInfoAction({ name, whatsappPhoneNumberId: waPnId || undefined });
      setInfoState("saved");
      setTimeout(() => setInfoState("idle"), 2500);
    });
  }

  // ── Services ───────────────────────────────────────────────────────────────
  const [services, setServices] = useState<ServiceView[]>(initServices);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_DRAFT);
  const [svcSaving, setSvcSaving] = useState(false);

  function startAdd() {
    setDraft(EMPTY_DRAFT);
    setEditingId("new");
  }

  function startEdit(s: ServiceView) {
    setDraft({
      id: s.id,
      name_en: s.nameEn,
      name_ar: s.nameAr,
      duration_min: s.durationMin,
      price: s.price == null ? "" : String(s.price),
    });
    setEditingId(s.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function saveService() {
    if (!draft.name_en.trim() || !draft.name_ar.trim() || draft.duration_min < 5) return;
    setSvcSaving(true);
    const input = {
      id: draft.id,
      name_en: draft.name_en.trim(),
      name_ar: draft.name_ar.trim(),
      duration_min: draft.duration_min,
      price: draft.price === "" ? null : Number(draft.price),
    };
    const res = await saveServiceAction(input);
    if (res.ok) {
      if (draft.id) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === draft.id
              ? {
                  id: s.id,
                  nameEn: input.name_en,
                  nameAr: input.name_ar,
                  durationMin: input.duration_min,
                  price: input.price,
                }
              : s,
          ),
        );
      } else if (res.id) {
        setServices((prev) => [
          ...prev,
          {
            id: res.id!,
            nameEn: input.name_en,
            nameAr: input.name_ar,
            durationMin: input.duration_min,
            price: input.price,
          },
        ]);
      }
      cancelEdit();
    }
    setSvcSaving(false);
  }

  async function deleteService(id: string) {
    if (!window.confirm("Delete this service?")) return;
    const res = await deleteServiceAction(id);
    if (res.ok) setServices((prev) => prev.filter((s) => s.id !== id));
  }

  // ── Working hours ──────────────────────────────────────────────────────────
  const [hours, setHours] = useState<WorkingHourInput[]>(initHours);
  const [hoursState, setHoursState] = useState<"idle" | "saving" | "saved">("idle");
  const [, hoursTransition] = useTransition();

  function toggleDay(idx: number) {
    setHours((prev) => prev.map((h, i) => (i === idx ? { ...h, is_open: !h.is_open } : h)));
  }

  function updateHour(idx: number, field: "open_time" | "close_time", val: string) {
    setHours((prev) => prev.map((h, i) => (i === idx ? { ...h, [field]: val } : h)));
  }

  function saveHours() {
    setHoursState("saving");
    hoursTransition(async () => {
      await saveWorkingHoursAction(hours);
      setHoursState("saved");
      setTimeout(() => setHoursState("idle"), 2500);
    });
  }

  const svcName = (s: ServiceView) => (locale === "ar" ? s.nameAr : s.nameEn);

  return (
    <div className="space-y-8 py-2">
      {/* ── Clinic info ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
          <Icon name="Building2" className="h-4 w-4 text-jade-600" />
          {st.infoHeading}
        </h2>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              {st.nameLabel}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={st.namePlaceholder}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-jade-500/50 focus:ring-2 focus:ring-jade-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              {st.waPnIdLabel}
            </label>
            <input
              value={waPnId}
              onChange={(e) => setWaPnId(e.target.value)}
              placeholder={st.waPnIdPlaceholder}
              dir="ltr"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-jade-500/50 focus:ring-2 focus:ring-jade-500/20"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">{st.waPnIdHint}</p>
          </div>
          <button
            type="button"
            onClick={saveInfo}
            disabled={infoState === "saving"}
            className={cn(
              "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              infoState === "saved"
                ? "bg-jade-500/12 text-jade-700"
                : "bg-jade-500 text-white hover:bg-jade-600 disabled:opacity-50",
            )}
          >
            {infoState === "saving"
              ? st.savingInfo
              : infoState === "saved"
                ? st.savedInfo
                : st.saveInfo}
          </button>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
          <Icon name="Stethoscope" className="h-4 w-4 text-jade-600" />
          {st.servicesHeading}
        </h2>
        <div className="rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {services.map((s) =>
              editingId === s.id ? (
                <li key={s.id} className="p-4">
                  <ServiceForm
                    draft={draft}
                    onChange={setDraft}
                    onSave={saveService}
                    onCancel={cancelEdit}
                    saving={svcSaving}
                    st={st}
                  />
                </li>
              ) : (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{svcName(s)}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.durationMin} {t.dashboard.booking.durationUnit}
                      {s.price != null && (
                        <span className="ms-2 font-semibold text-jade-700">
                          {s.price} {t.dashboard.booking.priceUnit}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {locale === "ar" ? "تعديل" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteService(s.id)}
                      className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500/80 transition-colors hover:bg-red-500/10 hover:text-red-600"
                    >
                      {st.deleteService}
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>

          {editingId === "new" ? (
            <div className="border-t border-border p-4">
              <ServiceForm
                draft={draft}
                onChange={setDraft}
                onSave={saveService}
                onCancel={cancelEdit}
                saving={svcSaving}
                st={st}
              />
            </div>
          ) : (
            <div className="border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={startAdd}
                className="cursor-pointer text-sm font-semibold text-jade-600 transition-colors hover:text-jade-700"
              >
                {st.addService}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Working hours ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
          <Icon name="Clock" className="h-4 w-4 text-jade-600" />
          {st.hoursHeading}
        </h2>
        <div className="rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {hours.map((h, idx) => (
              <li
                key={h.weekday}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="w-12 shrink-0 text-sm font-semibold text-foreground">
                  {st.weekdays[h.weekday]}
                </span>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={h.is_open}
                    onChange={() => toggleDay(idx)}
                    className="h-4 w-4 cursor-pointer rounded accent-jade-500"
                  />
                  <span className="text-xs text-muted-foreground">{st.openLabel}</span>
                </label>
                {h.is_open && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{st.fromLabel}</span>
                    <input
                      type="time"
                      value={h.open_time}
                      onChange={(e) => updateHour(idx, "open_time", e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-jade-500/50"
                    />
                    <span className="text-xs text-muted-foreground">{st.toLabel}</span>
                    <input
                      type="time"
                      value={h.close_time}
                      onChange={(e) => updateHour(idx, "close_time", e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-jade-500/50"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={saveHours}
              disabled={hoursState === "saving"}
              className={cn(
                "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                hoursState === "saved"
                  ? "bg-jade-500/12 text-jade-700"
                  : "bg-jade-500 text-white hover:bg-jade-600 disabled:opacity-50",
              )}
            >
              {hoursState === "saving"
                ? st.savingHours
                : hoursState === "saved"
                  ? st.hoursSaved
                  : st.saveHours}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
  st,
}: {
  draft: ServiceDraft;
  onChange: (d: ServiceDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  st: ReturnType<typeof useLanguage>["t"]["dashboard"]["booking"]["setupTab"];
}) {
  const set = (field: keyof ServiceDraft, val: string | number) =>
    onChange({ ...draft, [field]: val });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">{st.nameEnLabel}</label>
          <input
            value={draft.name_en}
            onChange={(e) => set("name_en", e.target.value)}
            dir="ltr"
            placeholder="e.g. Laser session"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-jade-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">{st.nameArLabel}</label>
          <input
            value={draft.name_ar}
            onChange={(e) => set("name_ar", e.target.value)}
            dir="rtl"
            placeholder="مثال: جلسة ليزر"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-jade-500/50"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">{st.durationLabel}</label>
          <input
            type="number"
            min={5}
            max={480}
            value={draft.duration_min}
            onChange={(e) => set("duration_min", Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-jade-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">{st.priceLabel}</label>
          <input
            type="number"
            min={0}
            value={draft.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="—"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-jade-500/50"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !draft.name_en.trim() || !draft.name_ar.trim()}
          className="cursor-pointer rounded-lg bg-jade-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-jade-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "…" : st.saveService}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {st.cancelService}
        </button>
      </div>
    </div>
  );
}
