/**
 * ReviewMediator — premium tradesman rating form + review list.
 *
 * Sub-ratings: Quality · Communication · Cleanliness
 * Escrow gate: Submit is locked unless escrowStatus is 'released' or 'funds_released'.
 * Private feedback: amber-bordered field sent to DB but excluded from visible_reviews
 *   (tradesman never sees it; admins read directly from reviews via service role).
 * Overall score: live-computed client-side as ROUND((q+c+cl)/3, 2) — matches the
 *   DB GENERATED column so the badge is always accurate before the row is saved.
 *
 * Usage:
 *   <ReviewMediator
 *     contractorId="<uuid>"
 *     jobId="<uuid>"
 *     escrowStatus="released"   // 'released' | 'funds_released' → unlocks form
 *     mode="both"               // 'form' | 'list' | 'both'
 *     onSuccess={(r) => console.log(r)}
 *   />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type EscrowStatus = string | null | undefined;

export interface ReviewMediatorProps {
  contractorId: string;
  jobId?: string;
  escrowStatus?: EscrowStatus;
  mode?: "form" | "list" | "both";
  onSuccess?: (review: VisibleReview) => void;
}

interface ReviewInsert {
  contractor_id: string;
  job_id: string;
  rating_quality: number;
  rating_communication: number;
  rating_cleanliness: number;
  comment?: string;
  private_feedback?: string;
}

interface VisibleReview {
  id: string;
  contractor_id: string;
  job_id: string;
  reviewer_id: string | null;
  rating_quality: number;
  rating_communication: number;
  rating_cleanliness: number;
  overall: number;
  comment: string | null;
  created_at: string;
}

interface ReviewSummary {
  review_count: number;
  avg_overall: number;
  avg_quality: number;
  avg_communication: number;
  avg_cleanliness: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RELEASED_STATUSES = new Set(["released", "funds_released"]);

const CATEGORIES = [
  { key: "rating_quality",       label: "Quality"       },
  { key: "rating_communication", label: "Communication" },
  { key: "rating_cleanliness",   label: "Cleanliness"   },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const SCORE_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

/** Tailwind bg class: red → orange → yellow → blue → green */
function scoreBg(score: number): string {
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-400";
  if (score <= 3) return "bg-yellow-400";
  if (score <= 4) return "bg-blue-500";
  return "bg-emerald-500";
}

/** Tailwind text/bg/border combo for chips + badges */
function scoreChip(score: number): string {
  if (score <= 1) return "text-red-600 bg-red-50 border-red-200";
  if (score <= 2) return "text-orange-600 bg-orange-50 border-orange-200";
  if (score <= 3) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  if (score <= 4) return "text-blue-600 bg-blue-50 border-blue-200";
  return "text-emerald-700 bg-emerald-50 border-emerald-200";
}

function liveOverall(q: number, c: number, cl: number): number {
  if (!q || !c || !cl) return 0;
  return Math.round(((q + c + cl) / 3) * 100) / 100;
}

function fmt(n: number): string {
  return n.toFixed(1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedBar({ score, animate = false }: { score: number; animate?: boolean }) {
  const [w, setW] = useState(animate ? 0 : (score / 5) * 100);
  useEffect(() => {
    if (!animate) { setW((score / 5) * 100); return; }
    const id = requestAnimationFrame(() => {
      const t = setTimeout(() => setW((score / 5) * 100), 60);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(id);
  }, [score, animate]);

  return (
    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", scoreBg(score))}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

function StarPicker({
  value, onChange, disabled = false, size = "md",
}: {
  value: number; onChange: (v: number) => void; disabled?: boolean; size?: "sm" | "md" | "lg";
}) {
  const [hov, setHov] = useState(0);
  const active = hov || value;
  const sz = size === "lg" ? "w-9 h-9" : size === "md" ? "w-6 h-6" : "w-3.5 h-3.5";
  return (
    <span
      className="inline-flex gap-1"
      onMouseLeave={() => !disabled && setHov(0)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i} type="button"
          disabled={disabled}
          onMouseEnter={() => !disabled && setHov(i)}
          onClick={() => !disabled && onChange(i)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm disabled:cursor-not-allowed"
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
        >
          <Star className={cn(
            sz, "transition-all duration-150",
            i <= active ? "text-amber-400 fill-amber-400 scale-110" : "text-muted-foreground/30 fill-none",
            disabled && "opacity-50",
          )} />
        </button>
      ))}
    </span>
  );
}

function MiniStars({ score }: { score: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(
          "w-3 h-3",
          i <= Math.round(score) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20 fill-none"
        )} />
      ))}
    </span>
  );
}

function DotPicker({ value, onChange, disabled = false }: {
  value: number; onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i} type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(i)}
          aria-label={`Score ${i}`}
          className={cn(
            "w-7 h-7 rounded-full border-2 text-xs font-bold transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed",
            i <= value
              ? cn(scoreBg(value), "border-transparent text-white scale-110 shadow-md")
              : "border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

// ─── Locked state ─────────────────────────────────────────────────────────────

function LockedOverlay() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Lock className="w-7 h-7 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-base font-heading font-semibold text-foreground">
          Review locked
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          The review form becomes available once the escrow payment has been
          released — confirming the job is complete.
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700">
        <Lock className="w-3 h-3" /> Awaiting payment release
      </span>
    </div>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────

type FormState = {
  rating_quality: number;
  rating_communication: number;
  rating_cleanliness: number;
  comment: string;
  private_feedback: string;
};

const EMPTY: FormState = {
  rating_quality: 0,
  rating_communication: 0,
  rating_cleanliness: 0,
  comment: "",
  private_feedback: "",
};

function ReviewForm({
  contractorId, jobId, escrowStatus, onSuccess,
}: {
  contractorId: string; jobId?: string; escrowStatus?: EscrowStatus;
  onSuccess?: (r: VisibleReview) => void;
}) {
  const canSubmit = RELEASED_STATUSES.has(escrowStatus ?? "");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<CategoryKey, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [apiError, setApiError] = useState("");

  const setField = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (k !== "comment" && k !== "private_feedback") {
      setErrors((p) => ({ ...p, [k]: undefined }));
    }
  }, []);

  const overall = liveOverall(
    form.rating_quality, form.rating_communication, form.rating_cleanliness
  );

  function validate(): boolean {
    const next: typeof errors = {};
    for (const { key, label } of CATEGORIES) {
      if (!form[key]) next[key] = `Please rate ${label}.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !validate()) return;

    setStatus("submitting");
    setApiError("");

    const payload: ReviewInsert = {
      contractor_id: contractorId,
      job_id: jobId ?? "",
      rating_quality: form.rating_quality,
      rating_communication: form.rating_communication,
      rating_cleanliness: form.rating_cleanliness,
      ...(form.comment.trim()           ? { comment:          form.comment.trim()          } : {}),
      ...(form.private_feedback.trim()  ? { private_feedback: form.private_feedback.trim() } : {}),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("reviews")
      .insert(payload)
      .select(
        "id, contractor_id, job_id, reviewer_id, rating_quality, rating_communication, rating_cleanliness, overall, comment, created_at"
      )
      .single();

    if (error) {
      setStatus("error");
      setApiError(error.message ?? "Something went wrong. Please try again.");
      return;
    }

    setStatus("success");
    onSuccess?.(data as VisibleReview);
  }

  if (!canSubmit) return <LockedOverlay />;

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-foreground">Review submitted!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Thank you — your feedback helps homeowners make confident choices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {/* ── Overall star picker ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 pb-6 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Overall Rating
        </p>
        {overall > 0 ? (
          <div className="flex flex-col items-center gap-1">
            <span className={cn(
              "text-5xl font-black font-heading leading-none",
              overall >= 4.5 ? "text-emerald-600" :
              overall >= 3   ? "text-blue-600"    :
              overall >= 2   ? "text-yellow-600"  : "text-red-600"
            )}>
              {fmt(overall)}
            </span>
            <MiniStars score={overall} />
            <span className="text-sm font-medium text-muted-foreground mt-0.5">
              {SCORE_LABELS[Math.round(overall)]}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Rate each category below</p>
        )}
      </div>

      {/* ── Category dot-pickers ──────────────────────────────────────────── */}
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category Ratings
        </p>
        {CATEGORIES.map(({ key, label }) => {
          const score = form[key];
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{label}</span>
                {score > 0 && (
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full border",
                    scoreChip(score)
                  )}>
                    {score}/5
                  </span>
                )}
              </div>
              <AnimatedBar score={score} />
              <DotPicker value={score} onChange={(v) => setField(key, v)} />
              {errors[key] && (
                <p className="text-xs text-destructive">{errors[key]}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Public feedback ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label htmlFor="rm-comment" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Feedback <span className="normal-case font-normal">(optional — visible to tradesman)</span>
        </label>
        <Textarea
          id="rm-comment"
          placeholder="What went well? Anything you'd like future customers to know?"
          value={form.comment}
          onChange={(e) => setField("comment", e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* ── Private feedback (admin-only) ─────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            🔐 Private Feedback
          </span>
          <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700 uppercase tracking-wide">
            Admin only
          </span>
        </div>
        <Textarea
          id="rm-private"
          placeholder="Anything the platform should know? This is never shown to the tradesman."
          value={form.private_feedback}
          onChange={(e) => setField("private_feedback", e.target.value)}
          rows={3}
          className={cn(
            "resize-none text-sm border-dashed",
            "border-amber-300 focus-visible:ring-amber-400 bg-amber-50/30 placeholder:text-amber-500/60"
          )}
        />
        <p className="text-xs text-muted-foreground">
          Stored securely — only platform admins can read this field.
        </p>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {apiError}
        </div>
      )}

      {/* ── Submit — three layers of escrow enforcement ───────────────────── */}
      <Button
        type="submit"
        size="lg"
        className="w-full font-semibold"
        disabled={!canSubmit || status === "submitting"}
        aria-disabled={!canSubmit}
        title={!canSubmit ? "Available once escrow payment is released" : undefined}
      >
        {status === "submitting"
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
          : "Submit Review"}
      </Button>
    </form>
  );
}

// ─── Review List ──────────────────────────────────────────────────────────────

function ReviewList({ contractorId }: { contractorId: string }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<VisibleReview[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [animate, setAnimate]   = useState(false);
  const containerRef            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    Promise.all([
      db.from("visible_reviews")
        .select("id, contractor_id, job_id, reviewer_id, rating_quality, rating_communication, rating_cleanliness, overall, comment, created_at")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false }),
    ]).then(([{ data, error: err }]: [{ data: VisibleReview[] | null; error: unknown }]) => {
      if (cancelled) return;
      if (err) { setError("Failed to load reviews."); setLoading(false); return; }

      const rows = data ?? [];
      setReviews(rows);

      if (rows.length > 0) {
        const avg = (k: keyof VisibleReview) =>
          rows.reduce((s, r) => s + Number(r[k]), 0) / rows.length;
        setSummary({
          review_count:       rows.length,
          avg_overall:        avg("overall"),
          avg_quality:        avg("rating_quality"),
          avg_communication:  avg("rating_communication"),
          avg_cleanliness:    avg("rating_cleanliness"),
        });
      }

      setLoading(false);
      requestAnimationFrame(() => setTimeout(() => !cancelled && setAnimate(true), 60));
    });

    return () => { cancelled = true; };
  }, [contractorId]);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
    </div>
  );

  if (!summary) return (
    <p className="text-center text-muted-foreground py-12 text-sm">
      No reviews yet — be the first to leave feedback!
    </p>
  );

  const SUMMARY_CATS = [
    { key: "avg_quality"       as const, label: "Quality"       },
    { key: "avg_communication" as const, label: "Communication" },
    { key: "avg_cleanliness"   as const, label: "Cleanliness"   },
  ];

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Aggregate hero */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-secondary/40 border border-border">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-6xl font-black font-heading text-foreground leading-none">
            {fmt(summary.avg_overall)}
          </span>
          <MiniStars score={summary.avg_overall} />
          <span className="text-xs text-muted-foreground mt-1">
            {summary.review_count} review{summary.review_count !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex-1 w-full space-y-3 min-w-0">
          {SUMMARY_CATS.map(({ key, label }) => {
            const score = summary[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
                <div className="flex-1">
                  <AnimatedBar score={score} animate={animate} />
                </div>
                <span className="text-xs font-semibold text-foreground w-8 text-right shrink-0">
                  {fmt(score)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual cards */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <Card key={r.id} className="border-border shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <MiniStars score={r.overall} />
                      <span className="text-sm font-bold text-foreground">{fmt(r.overall)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {r.comment && (
                <p className="text-sm text-foreground/80 leading-relaxed pl-11">{r.comment}</p>
              )}

              <div className="flex flex-wrap gap-2 pl-11">
                {[
                  { label: "Quality",       score: r.rating_quality       },
                  { label: "Communication", score: r.rating_communication },
                  { label: "Cleanliness",   score: r.rating_cleanliness   },
                ].map(({ label, score }) => (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                      scoreChip(score)
                    )}
                  >
                    {label}: {score}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ReviewMediator({
  contractorId, jobId, escrowStatus, mode = "both", onSuccess,
}: ReviewMediatorProps) {
  const [tab, setTab] = useState<"form" | "list">(mode === "list" ? "list" : "form");
  const showTabs = mode === "both";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {showTabs && (
        <div className="flex rounded-xl bg-secondary p-1 mb-6">
          {(["form", "list"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "form" ? "Leave a Review" : "All Reviews"}
            </button>
          ))}
        </div>
      )}

      <Card className="border-border shadow-md">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            {tab === "form" ? "Rate Your Tradesman" : "Contractor Reviews"}
          </CardTitle>
          {tab === "form" && RELEASED_STATUSES.has(escrowStatus ?? "") && (
            <p className="text-sm text-muted-foreground">
              Your honest feedback helps homeowners choose with confidence.
            </p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {(mode === "form" || tab === "form") && (
            <ReviewForm
              contractorId={contractorId}
              jobId={jobId}
              escrowStatus={escrowStatus}
              onSuccess={onSuccess}
            />
          )}
          {(mode === "list" || tab === "list") && (
            <ReviewList contractorId={contractorId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReviewMediator;
