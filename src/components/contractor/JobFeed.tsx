import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { api, Job } from "@/lib/api";
import {
  Flame,
  Clock,
  AlertTriangle,
  Loader2,
  Gavel,
  X,
  PoundSterling,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jobTitle(job: Job): string {
  const trade = job.analysis_result?.trade_category as string | undefined;
  const date = new Date(job.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  return trade ? `${trade} Issue – ${date}` : `Home Project – ${date}`;
}

function urgencyClass(urgency: string): string {
  if (urgency.toLowerCase().includes("high"))
    return "bg-destructive/10 text-destructive";
  if (urgency.toLowerCase().includes("medium"))
    return "bg-accent/10 text-accent-foreground";
  return "bg-primary/10 text-primary";
}

// ─── Bid form ─────────────────────────────────────────────────────────────────

interface BidFormProps {
  job: Job;
  onClose: () => void;
  onSuccess: () => void;
}

function BidForm({ job, onClose, onSuccess }: BidFormProps) {
  const { toast } = useToast();
  const [amountGbp, setAmountGbp] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const pounds = parseFloat(amountGbp);
    if (isNaN(pounds) || pounds <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a positive amount in £.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await api.bids.submit(job.id, Math.round(pounds * 100), note.trim());
      toast({
        title: "Bid submitted!",
        description: "The homeowner will be notified to review your bid.",
      });
      onSuccess();
    } catch (e) {
      toast({
        title: "Failed to submit bid",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/40 shadow-md">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-heading">
          Bid on — {jobTitle(job)}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Your Price (£)
          </label>
          <div className="relative">
            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              value={amountGbp}
              onChange={(e) => setAmountGbp(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Scope of Work
          </label>
          <Textarea
            placeholder="Describe what you'll do, your timeline, materials included, any conditions…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !amountGbp || !note.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4 mr-2" /> Submit Bid
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────

interface JobCardProps {
  job: Job;
  isActiveBid: boolean;
  onBid: () => void;
}

function JobCard({ job, isActiveBid, onBid }: JobCardProps) {
  const r = job.analysis_result ?? {};
  const trade = r.trade_category as string | undefined;
  const summary = r.summary as string | undefined;
  const urgency = r.urgency as string | undefined;
  const cost = r.estimated_cost_range as string | undefined;

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {trade && (
                <span className="text-xs font-bold uppercase tracking-wide text-primary">
                  {trade}
                </span>
              )}
              {urgency && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgencyClass(urgency)}`}
                >
                  {urgency}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {jobTitle(job)}
            </h3>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {summary}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {cost && (
                <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                  <PoundSterling className="w-3 h-3 text-muted-foreground" />{" "}
                  Est. {cost}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(job.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            onClick={onBid}
            disabled={isActiveBid}
          >
            <Gavel className="w-3.5 h-3.5 mr-1.5" /> Bid
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Job Feed ─────────────────────────────────────────────────────────────────

export function JobFeed() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidTarget, setBidTarget] = useState<Job | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.jobs.list();
      setJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading job feed…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          Failed to load job feed
        </p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Flame className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">
            No Open Jobs
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Check back soon — jobs matching your expertise will appear here.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bidTarget && (
        <BidForm
          job={bidTarget}
          onClose={() => setBidTarget(null)}
          onSuccess={() => {
            setBidTarget(null);
            load();
          }}
        />
      )}

      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          isActiveBid={bidTarget?.id === job.id}
          onBid={() => setBidTarget(job)}
        />
      ))}
    </div>
  );
}
