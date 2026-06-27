"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import { answerQuestionAction, dismissQuestionAction } from "../booking/booking-actions";
import type { QuestionView } from "@/lib/booking/questions";

const STR = {
  en: {
    title: "Patient questions", subtitle: "Medical questions the agent forwarded to the doctor.",
    empty: "No questions yet. When a patient asks the agent something clinical, it lands here.",
    open: "Open", answered: "Answered", dismissed: "Dismissed", all: "All",
    answer: "Answer", dismiss: "Dismiss", save: "Save reply", saving: "Saving…", cancel: "Cancel",
    answerPlaceholder: "Reply for the patient…", channelVoice: "Call", channelWhatsapp: "WhatsApp", channelManual: "Manual",
    answeredLabel: "Reply",
  },
  ar: {
    title: "أسئلة المرضى", subtitle: "أسئلة طبية حوّلها الوكيل للدكتور.",
    empty: "لا أسئلة بعد. لما المريض يسأل الوكيل سؤالًا طبيًا، هيظهر هنا.",
    open: "مفتوحة", answered: "تمت الإجابة", dismissed: "مُهمَلة", all: "الكل",
    answer: "إجابة", dismiss: "تجاهل", save: "حفظ الرد", saving: "جاري الحفظ…", cancel: "إلغاء",
    answerPlaceholder: "الرد على المريض…", channelVoice: "مكالمة", channelWhatsapp: "واتساب", channelManual: "يدوي",
    answeredLabel: "الرد",
  },
};

type Filter = "open" | "answered" | "dismissed" | "all";

export function QuestionsPanel({ initial }: { initial: QuestionView[] }) {
  const { locale } = useLanguage();
  const L = STR[locale === "ar" ? "ar" : "en"];
  const [questions, setQuestions] = useState<QuestionView[]>(initial);
  const [filter, setFilter] = useState<Filter>("open");

  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const channelLabel = (c: string) =>
    c === "voice" ? L.channelVoice : c === "manual" ? L.channelManual : L.channelWhatsapp;

  const filtered = filter === "all" ? questions : questions.filter((q) => q.status === filter);
  const count = (f: Filter) => (f === "all" ? questions.length : questions.filter((q) => q.status === f).length);

  function update(q: QuestionView) {
    setQuestions((prev) => prev.map((x) => (x.id === q.id ? q : x)));
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">{L.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{L.subtitle}</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["open", "answered", "dismissed", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              filter === f ? "bg-jade-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {L[f]} <span className="ms-1.5 opacity-70">{count(f)}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="HelpCircle" className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="max-w-sm text-sm text-muted-foreground">{L.empty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              L={L}
              channelLabel={channelLabel}
              fmt={(iso) => dateFmt.format(new Date(iso))}
              onUpdate={update}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function QuestionCard({
  q,
  L,
  channelLabel,
  fmt,
  onUpdate,
}: {
  q: QuestionView;
  L: (typeof STR)["en"];
  channelLabel: (c: string) => string;
  fmt: (iso: string) => string;
  onUpdate: (q: QuestionView) => void;
}) {
  const [answering, setAnswering] = useState(false);
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!reply.trim()) return;
    startTransition(async () => {
      const res = await answerQuestionAction(q.id, reply);
      if (res.ok) {
        onUpdate({ ...q, status: "answered", answer: reply.trim(), answeredAt: new Date().toISOString() });
        setAnswering(false);
      }
    });
  }
  function dismiss() {
    startTransition(async () => {
      const res = await dismissQuestionAction(q.id);
      if (res.ok) onUpdate({ ...q, status: "dismissed" });
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground">{q.question}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold">{q.patientName || q.patientPhone || "—"}</span>
            <span className="rounded-full bg-muted px-2 py-0.5">{channelLabel(q.channel)}</span>
            <span>{fmt(q.createdAt)}</span>
          </p>
        </div>
        {q.status === "open" && !answering && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setAnswering(true)}
              className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-jade-600 transition-colors hover:bg-jade-500/10"
            >
              {L.answer}
            </button>
            <button
              type="button"
              onClick={dismiss}
              disabled={pending}
              className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {L.dismiss}
            </button>
          </div>
        )}
      </div>

      {q.status === "answered" && q.answer && (
        <div className="mt-3 rounded-xl bg-jade-500/8 p-3">
          <p className="text-xs font-semibold text-jade-700">{L.answeredLabel}</p>
          <p className="mt-1 text-sm text-foreground">{q.answer}</p>
        </div>
      )}

      {answering && (
        <div className="mt-3 space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={L.answerPlaceholder}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-jade-500/50"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending || !reply.trim()}
              className="cursor-pointer rounded-lg bg-jade-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-jade-600 disabled:opacity-50"
            >
              {pending ? L.saving : L.save}
            </button>
            <button
              type="button"
              onClick={() => setAnswering(false)}
              className="cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
            >
              {L.cancel}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
