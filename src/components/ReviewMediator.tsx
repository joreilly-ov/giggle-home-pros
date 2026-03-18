/**
 * ReviewMediator — premium feedback form + list component.
 *
 * Usage:
 *   <ReviewMediator
 *     contractorId="<uuid>"
 *     jobId="<uuid>"
 *     token={supabaseAccessToken}
 *     mode="both"          // 'form' | 'list' | 'both'
 *     onSuccess={(r) => console.log('submitted', r)}
 *   />
 *
 * API base defaults to VITE_REVIEWS_API_URL env variable, or "/api".
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewCreatePayload {
  contractor_id: string;
  job_id: string;
  overall: number;
  quality: number;
  communication: number;
  timeliness: number;
  value: number;
  professionalism: number;
  comment?: string;
}

interface ReviewResponse {
  id: string;
  contractor_id: string;
  job_id: string;
  reviewer_id: string;
  overall: number;
  quality: number;
  communication: number;
  timeliness: number;
  value: number;
  professionalism: number;
  comment?: string;
  created_at: string;
}

interface ReviewSummary {
  contractor_id: string;
  review_count: number;
  avg_overall: number;
  avg_quality: number;
  avg_communication: number;
  avg_timeliness: number;
  avg_value: number;
  avg_professionalism: number;
}

export interface ReviewMediatorProps {
  contractorId: string;
  jobId?: string;
  token: string;
  mode?: "form" | "list" | "both";
  apiBase?: string;
  onSuccess?: (review: ReviewResponse) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { key: keyof Omit<ReviewCreatePayload, "contractor_id" | "job_id" | "overall" | "comment">; label: string }[] = [
  { key: "quality",        label: "Quality of Work"   },
  { key: "communication",  label: "Communication"     },
  { key: "timeliness",     label: "On-Time Delivery"  },
  { key: "value",          label: "Value for Money"   },
  { key: "professionalism",label: "Professionalism"   },
];

type CategoryKey = (typeof CATEGORIES)[number]["key"];

/** Returns a Tailwind bg colour class based on score 1–5 (red→orange→yellow→blue→green). */
function scoreToColour(score: number): string {
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-400";
  if (score <= 3) return "bg-yellow-400";
  if (score <= 4) return "bg-blue-500";
  return "bg-emerald-500";
}

/** Text version for badges / chips */
function scoreToTextColour(score: number): string {
  if (score <= 1) return "text-red-600 bg-red-50 border-red-200";
  if (score <= 2) return "text-orange-600 bg-orange-50 border-orange-200";
  if (score <= 3) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  if (score <= 4) return "text-blue-600 bg-blue-50 border-blue-200";
  return "text-emerald-700 bg-emerald-50 border-emerald-200";
}

function formatScore(n: number): string {
  return n % 1 === 0 ? n.toFixed(1) : n.toFixed(1);
}

// ─── Animated progress bar ────────────────────────────────────────────────────

function ProgressBar({ score, animate = false }: { score: number; animate?: boolean }) {
  const [width, setWidth] = useState(animate ? 0 : (score / 5) * 100);

  useEffect(() => {
    if (!animate) return;
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setWidth((score / 5) * 100), 80);
    });
    return () => cancelAnimationFrame(raf);
  }, [score, animate]);

  return (
    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", scoreToColour(score))}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ─── Mini star display ────────────────────────────────────────────────────────

function MiniStars({ score }: { score: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "w-3 h-3",
            i <= Math.round(score) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30 fill-none"
          )}
        />
      ))}
    </span>
  );
}

// ─── Star picker (interactive) ────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const sz = size === "lg" ? "w-9 h-9" : size === "md" ? "w-6 h-6" : "w-4 h-4";

  return (
    <span className="inline-flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onClick={() => onChange(i)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              sz,
              "transition-all duration-150",
              i <= active
                ? "text-amber-400 fill-amber-400 scale-110"
                : "text-muted-foreground/30 fill-none"
            )}
          />
        </button>
      ))}
    </span>
  );
}

// ─── Dot button score picker (1–5) ────────────────────────────────────────────

function DotPicker({ value, onChange, colour }: { value: number; onChange: (v: number) => void; colour: string }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`Score ${i}`}
          className={cn(
            "w-7 h-7 rounded-full border-2 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            i <= value
              ? cn(colour, "border-transparent text-white scale-110 shadow-md")
              : "border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────

type FormState = {
  overall: number;
  quality: number;
  communication: number;
  timeliness: number;
  value: number;
  professionalism: number;
  comment: string;
};

const DEFAULT_FORM: FormState = {
  overall: 0,
  quality: 0,
  communication: 0,
  timeliness: 0,
  value: 0,
  professionalism: 0,
  comment: "",
};

function ReviewForm({
  contractorId,
  jobId,
  token,
  apiBase,
  onSuccess,
}: {
  contractorId: string;
  jobId?: string;
  token: string;
  apiBase: string;
  onSuccess?: (r: ReviewResponse) => void;
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [apiError, setApiError] = useState("");

  const setField = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  }, []);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.overall) next.overall = "Please pick an overall rating.";
    for (const { key, label } of CATEGORIES) {
      if (!form[key]) next[key] = `Please rate ${label}.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setApiError("");

    const payload: ReviewCreatePayload = {
      contractor_id: contractorId,
      job_id: jobId ?? "",
      overall: form.overall,
      quality: form.quality,
      communication: form.communication,
      timeliness: form.timeliness,
      value: form.value,
      professionalism: form.professionalism,
      ...(form.comment.trim() ? { comment: form.comment.trim() } : {}),
    };

    try {
      const res = await fetch(`${apiBase}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? `Server error ${res.status}`);
      }

      const review: ReviewResponse = await res.json();
      setStatus("success");
      onSuccess?.(review);
    } catch (err) {
      setStatus("error");
      setApiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-foreground">Review submitted!</h3>
          <p className="text-sm text-muted-foreground mt-1">Thank you for your feedback. It helps homeowners make great choices.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Overall star rating */}
      <div className="flex flex-col items-center gap-3 pb-6 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Rating</p>
        <StarPicker value={form.overall} onChange={(v) => setField("overall", v)} size="lg" />
        {form.overall > 0 && (
          <span className="text-sm font-medium text-muted-foreground">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][form.overall]}
          </span>
        )}
        {errors.overall && <p className="text-xs text-destructive">{errors.overall}</p>}
      </div>

      {/* Category dot-pickers with animated bars */}
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category Ratings</p>
        {CATEGORIES.map(({ key, label }) => {
          const score = form[key] as number;
          const colour = score
            ? scoreToColour(score).replace("bg-", "bg-")  // used in DotPicker
            : "bg-muted";
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{label}</span>
                {score > 0 && (
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", scoreToTextColour(score))}>
                    {score}/5
                  </span>
                )}
              </div>
              <ProgressBar score={score} />
              <DotPicker
                value={score}
                onChange={(v) => setField(key, v)}
                colour={scoreToColour(score)}
              />
              {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
            </div>
          );
        })}
      </div>

      {/* Optional comment */}
      <div className="space-y-2">
        <label htmlFor="review-comment" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Comments <span className="normal-case font-normal">(optional)</span>
        </label>
        <Textarea
          id="review-comment"
          placeholder="Share more about your experience…"
          value={form.comment}
          onChange={(e) => setField("comment", e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Error banner */}
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {apiError}
        </div>
      )}

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="w-full font-semibold"
        size="lg"
      >
        {status === "submitting" ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}

// ─── Review List ──────────────────────────────────────────────────────────────

function ReviewList({
  contractorId,
  token,
  apiBase,
}: {
  contractorId: string;
  token: string;
  apiBase: string;
}) {
  const [summary, setSummary]     = useState<ReviewSummary | null>(null);
  const [reviews, setReviews]     = useState<ReviewResponse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [visible, setVisible]     = useState(false);
  const containerRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${apiBase}/reviews/summary/${contractorId}`, { headers }).then((r) => r.json()),
      fetch(`${apiBase}/reviews/contractor/${contractorId}`, { headers }).then((r) => r.json()),
    ])
      .then(([sum, revs]) => {
        if (cancelled) return;
        setSummary(sum);
        setReviews(Array.isArray(revs) ? revs : []);
        setLoading(false);
        // Trigger bar animations after paint
        requestAnimationFrame(() => setTimeout(() => setVisible(true), 60));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? "Failed to load reviews.");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [contractorId, token, apiBase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
      </div>
    );
  }

  if (!summary || summary.review_count === 0) {
    return (
      <p className="text-center text-muted-foreground py-12 text-sm">
        No reviews yet. Be the first to leave feedback!
      </p>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Aggregate score hero */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-secondary/40 border border-border">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-6xl font-black font-heading text-foreground leading-none">
            {formatScore(summary.avg_overall)}
          </span>
          <StarPicker value={Math.round(summary.avg_overall)} onChange={() => {}} size="md" />
          <span className="text-xs text-muted-foreground mt-1">
            {summary.review_count} review{summary.review_count !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex-1 w-full space-y-3 min-w-0">
          {CATEGORIES.map(({ key, label }) => {
            const score = summary[`avg_${key}` as keyof ReviewSummary] as number;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">{label}</span>
                <div className="flex-1">
                  <ProgressBar score={score} animate={visible} />
                </div>
                <span className="text-xs font-semibold text-foreground w-8 text-right shrink-0">
                  {formatScore(score)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual review cards */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="border-border shadow-sm">
            <CardContent className="p-5 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <MiniStars score={review.overall} />
                      <span className="text-sm font-bold text-foreground">{formatScore(review.overall)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-foreground/80 leading-relaxed pl-11">{review.comment}</p>
              )}

              {/* Category chips */}
              <div className="flex flex-wrap gap-2 pl-11">
                {CATEGORIES.map(({ key, label }) => {
                  const score = review[key as keyof ReviewResponse] as number;
                  return (
                    <span
                      key={key}
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                        scoreToTextColour(score)
                      )}
                    >
                      {label.split(" ")[0]}: {score}
                    </span>
                  );
                })}
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
  contractorId,
  jobId,
  token,
  mode = "both",
  apiBase = import.meta.env.VITE_REVIEWS_API_URL ?? "/api",
  onSuccess,
}: ReviewMediatorProps) {
  const [activeTab, setActiveTab] = useState<"form" | "list">(
    mode === "list" ? "list" : "form"
  );

  const showTabs = mode === "both";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {showTabs && (
        <div className="flex rounded-xl bg-secondary p-1 mb-6">
          {(["form", "list"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "form" ? "Leave a Review" : "All Reviews"}
            </button>
          ))}
        </div>
      )}

      <Card className="border-border shadow-md">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            {activeTab === "form" ? "Share Your Experience" : "Contractor Reviews"}
          </CardTitle>
          {activeTab === "form" && (
            <p className="text-sm text-muted-foreground">
              Your honest feedback helps homeowners choose the right pro.
            </p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {(mode === "form" || activeTab === "form") && (
            <ReviewForm
              contractorId={contractorId}
              jobId={jobId}
              token={token}
              apiBase={apiBase}
              onSuccess={onSuccess}
            />
          )}
          {(mode === "list" || activeTab === "list") && (
            <ReviewList
              contractorId={contractorId}
              token={token}
              apiBase={apiBase}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReviewMediator;
