"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/plans";
import { savePlan, deletePlan } from "./actions";
import { buttonClasses } from "@/components/ui/button";

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

type FormState = {
  slug: string;
  type: "personal" | "organization";
  max_members: string;
  price_monthly: string;
  price_yearly: string;
  name_en: string;
  name_ar: string;
  blurb_en: string;
  blurb_ar: string;
  features_en: string;
  features_ar: string;
  cta_en: string;
  cta_ar: string;
  price_label_en: string;
  price_label_ar: string;
  cta_action: "signup" | "contact";
  featured: boolean;
  is_active: boolean;
  sort_order: string;
};

function toForm(p?: Plan): FormState {
  return {
    slug: p?.slug ?? "",
    type: p?.type ?? "personal",
    max_members: String(p?.max_members ?? 1),
    price_monthly: p?.price_monthly?.toString() ?? "",
    price_yearly: p?.price_yearly?.toString() ?? "",
    name_en: p?.name.en ?? "",
    name_ar: p?.name.ar ?? "",
    blurb_en: p?.blurb.en ?? "",
    blurb_ar: p?.blurb.ar ?? "",
    features_en: (p?.features.en ?? []).join("\n"),
    features_ar: (p?.features.ar ?? []).join("\n"),
    cta_en: p?.cta.en ?? "",
    cta_ar: p?.cta.ar ?? "",
    price_label_en: p?.price_label?.en ?? "",
    price_label_ar: p?.price_label?.ar ?? "",
    cta_action: p?.cta_action ?? "signup",
    featured: p?.featured ?? false,
    is_active: p?.is_active ?? true,
    sort_order: String(p?.sort_order ?? 0),
  };
}

const field = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const area = "h-24 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const label = "mb-1 block text-xs font-semibold text-muted-foreground";

export function PlanForm({ plan }: { plan?: Plan }) {
  const [f, setF] = useState<FormState>(() => toForm(plan));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = () =>
    start(async () => {
      setMsg(null);
      const res = await savePlan({
        id: plan?.id,
        slug: f.slug.trim(),
        type: f.type,
        max_members: Number(f.max_members) || 1,
        price_monthly: f.price_monthly === "" ? null : Number(f.price_monthly),
        price_yearly: f.price_yearly === "" ? null : Number(f.price_yearly),
        name: { en: f.name_en, ar: f.name_ar },
        blurb: { en: f.blurb_en, ar: f.blurb_ar },
        features: { en: lines(f.features_en), ar: lines(f.features_ar) },
        cta: { en: f.cta_en, ar: f.cta_ar },
        price_label: f.price_label_en || f.price_label_ar ? { en: f.price_label_en, ar: f.price_label_ar } : null,
        cta_action: f.cta_action,
        featured: f.featured,
        is_active: f.is_active,
        sort_order: Number(f.sort_order) || 0,
      });
      setMsg(res.ok ? "Saved ✓" : `Error: ${res.error}`);
      if (res.ok) router.refresh();
    });

  const remove = () =>
    start(async () => {
      if (!plan?.id) return;
      const res = await deletePlan(plan.id);
      if (res.ok) router.refresh();
      else setMsg(`Error: ${res.error}`);
    });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className={label}>Slug</label>
          <input className={field} value={f.slug} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div>
          <label className={label}>Type</label>
          <select className={field} value={f.type} onChange={(e) => set("type", e.target.value as FormState["type"])}>
            <option value="personal">personal</option>
            <option value="organization">organization</option>
          </select>
        </div>
        <div>
          <label className={label}>Max members</label>
          <input type="number" className={field} value={f.max_members} onChange={(e) => set("max_members", e.target.value)} />
        </div>
        <div>
          <label className={label}>Price / mo</label>
          <input type="number" className={field} value={f.price_monthly} onChange={(e) => set("price_monthly", e.target.value)} placeholder="blank = custom" />
        </div>
        <div>
          <label className={label}>Price / yr</label>
          <input type="number" className={field} value={f.price_yearly} onChange={(e) => set("price_yearly", e.target.value)} />
        </div>
        <div>
          <label className={label}>Sort order</label>
          <input type="number" className={field} value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
        </div>
        <div>
          <label className={label}>Name (EN)</label>
          <input className={field} value={f.name_en} onChange={(e) => set("name_en", e.target.value)} />
        </div>
        <div>
          <label className={label}>Name (AR)</label>
          <input dir="rtl" className={field} value={f.name_ar} onChange={(e) => set("name_ar", e.target.value)} />
        </div>
        <div>
          <label className={label}>CTA action</label>
          <select className={field} value={f.cta_action} onChange={(e) => set("cta_action", e.target.value as FormState["cta_action"])}>
            <option value="signup">signup</option>
            <option value="contact">contact</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className={label}>Blurb (EN)</label>
          <input className={field} value={f.blurb_en} onChange={(e) => set("blurb_en", e.target.value)} />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className={label}>Blurb (AR)</label>
          <input dir="rtl" className={field} value={f.blurb_ar} onChange={(e) => set("blurb_ar", e.target.value)} />
        </div>
        <div>
          <label className={label}>CTA (EN)</label>
          <input className={field} value={f.cta_en} onChange={(e) => set("cta_en", e.target.value)} />
        </div>
        <div>
          <label className={label}>CTA (AR)</label>
          <input dir="rtl" className={field} value={f.cta_ar} onChange={(e) => set("cta_ar", e.target.value)} />
        </div>
        <div>
          <label className={label}>Price label (EN)</label>
          <input className={field} value={f.price_label_en} onChange={(e) => set("price_label_en", e.target.value)} placeholder="e.g. Custom" />
        </div>
        <div>
          <label className={label}>Price label (AR)</label>
          <input dir="rtl" className={field} value={f.price_label_ar} onChange={(e) => set("price_label_ar", e.target.value)} />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-3">
          <div>
            <label className={label}>Features EN (one per line)</label>
            <textarea className={area} value={f.features_en} onChange={(e) => set("features_en", e.target.value)} />
          </div>
          <div>
            <label className={label}>Features AR (one per line)</label>
            <textarea dir="rtl" className={area} value={f.features_ar} onChange={(e) => set("features_ar", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active
        </label>
        <div className="ms-auto flex items-center gap-3">
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          {plan?.id && (
            <button type="button" onClick={remove} disabled={pending} className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50">
              Delete
            </button>
          )}
          <button type="button" onClick={save} disabled={pending} className={buttonClasses({ size: "sm" })}>
            {pending ? "Saving…" : plan ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
