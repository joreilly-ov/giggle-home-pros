import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ClipboardList,
  CheckCircle,
  CheckCircle2,
  Clock,
  Briefcase,
  Circle,
  PlusCircle,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Gavel,
  Send,
  PlayCircle,
  Flag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, Job, JobStatus, EscrowStatusValue } from "@/lib/api";
import { JobBids } from "@/components/customer/JobBids";
import { EscrowPayment } from "@/components/escrow/EscrowPayment";
import { EscrowStatusBanner } from "@/components/escrow/EscrowStatusBanner";
import { EscrowActions } from "@/components/escrow/EscrowActions";
import { MilestonesCard } from "@/components/milestones/MilestonesCard";
import { JobQuestions } from "@/components/questions/JobQuestions";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; classes: string; dot: string }
> = {
  draft: {
    label: "Draft",
    classes: "bg-secondary text-muted-foreground border-border",
    dot: "bg-muted-foreground/60",
  },
  open: {
    label: "Seeking Bids",
    classes: "bg-accent/50 text-accent-foreground border-accent/30",
    dot: "bg-accent-foreground/60",
  },
  awarded: {
    label: "Bid Accepted",
    classes: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  in_progress: {
    label: "In Progress",
    classes: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  completed: {
    label: "Completed",
    classes:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    classes:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    dot: "bg-red-500",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function projectTitle(job: Job): string {
  const r = job.analysis_result;
  const trade = (r?.problem_type ?? r?.trade_category) as string | undefined;
  const date = new Date(job.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  if (trade) return `${trade.charAt(0).toUpperCase() + trade.slice(1)} Issue – ${date}`;
  return `Home Project – ${date}`;
}

// ─── Detail sheet content ─────────────────────────────────────────────────────

interface JobDetailProps {
  job: Job;
  onStatusChanged: () => void;
  onClose: () => void;
}

function JobDetail({ job, onStatusChanged, onClose }: JobDetailProps) {
  const { toast } = useToast();
  const [transitioning, setTransitioning] = useState(false);
  const [escrowStatus, setEscrowStatus] = useState<EscrowStatusValue | null>(null);

  const r = job.analysis_result as Record<string, unknown> | null;
  const urgency = (r?.urgency as string | undefined)?.toLowerCase();
  const description = (r?.description ?? r?.summary) as string | undefined;
  const problemType = (r?.problem_type ?? r?.trade_category) as string | undefined;
  const locationInHome = r?.location_in_home as string | undefined;
  const materials = (r?.materials_involved ?? r?.materials) as string[] | undefined;
  const questions = r?.clarifying_questions as string[] | undefined;
  const meta = r?.video_metadata as Record<string, unknown> | undefined;
  const cfg = STATUS_CONFIG[job.status];

  const urgencyStyle = urgency?.includes("emergency") || urgency?.includes("high")
    ? "bg-destructive/10 text-destructive"
    : urgency?.includes("medium")
    ? "bg-accent/10 text-accent-foreground"
    : "bg-primary/10 text-primary";

  const transition = async (status: JobStatus, label: string) => {
    setTransitioning(true);
    try {
      await api.jobs.updateStatus(job.id, status);
      toast({ title: label });
      onStatusChanged();
      if (status === "cancelled") onClose();
    } catch (e) {
      toast({
        title: "Failed to update job",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setTransitioning(false);
    }
  };

  const showBids =
    job.status === "open" ||
    job.status === "awarded" ||
    job.status === "in_progress" ||
    job.status === "completed";

  return (
    <>
      <SheetHeader className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <SheetTitle className="font-heading">{projectTitle(job)}</SheetTitle>
          <Badge
            variant="outline"
            className={`text-xs font-semibold border flex items-center gap-1.5 ${cfg.classes}`}
          >
            <Circle className={`w-1.5 h-1.5 fill-current ${cfg.dot} rounded-full`} />
            {cfg.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Posted{" "}
          {new Date(job.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </SheetHeader>

      {/* Status actions */}
      <div className="mb-5 flex flex-wrap gap-2">
        {job.status === "draft" && (
          <Button
            size="sm"
            disabled={transitioning}
            onClick={() => transition("open", "Job published — contractors can now bid.")}
            className="gap-1.5"
          >
            {transitioning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Publish Job
          </Button>
        )}
        {job.status === "awarded" && (
          <Button
            size="sm"
            disabled={transitioning}
            onClick={() => transition("in_progress", "Work marked as started.")}
            className="gap-1.5"
          >
            {transitioning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5" />
            )}
            Mark Work Started
          </Button>
        )}
        {job.status === "in_progress" && (
          <Button
            size="sm"
            disabled={transitioning}
            onClick={() => transition("completed", "Job marked as complete.")}
            className="gap-1.5"
          >
            {transitioning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Flag className="w-3.5 h-3.5" />
            )}
            Mark Complete
          </Button>
        )}
        {(job.status === "draft" || job.status === "open") && (
          <Button
            size="sm"
            variant="outline"
            disabled={transitioning}
            className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => transition("cancelled", "Job cancelled.")}
          >
            Cancel Job
          </Button>
        )}
      </div>

      {/* Analysis details */}
      {r && (
        <div className="space-y-3 mb-6">
          {description && (
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                AI Summary
              </p>
              <p className="text-sm text-foreground leading-relaxed">{description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {urgency && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Urgency
                </p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${urgencyStyle}`}>
                  {urgency === "emergency" ? "🚨 Emergency" : urgency}
                </span>
              </div>
            )}
            {problemType && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Trade
                </p>
                <p className="text-sm font-semibold text-foreground capitalize">{problemType}</p>
              </div>
            )}
            {locationInHome && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Location
                </p>
                <p className="text-sm font-semibold text-foreground capitalize">{locationInHome}</p>
              </div>
            )}
            {meta?.duration_seconds && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Video
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {Math.round(meta.duration_seconds as number)}s
                  {meta.width && ` · ${meta.width}×${meta.height}`}
                </p>
              </div>
            )}
          </div>

          {Array.isArray(materials) && materials.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Materials Involved
              </p>
              <div className="flex flex-wrap gap-2">
                {materials.map((m, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(questions) && questions.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Questions for the Tradesperson
              </p>
              <ul className="space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <Circle className="w-3 h-3 text-primary shrink-0 mt-1" /> {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {r.estimated_cost_range && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Estimated Cost
              </p>
              <p className="text-sm font-semibold text-foreground">{r.estimated_cost_range as string}</p>
            </div>
          )}

          {Array.isArray(r.recommendations) && r.recommendations.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Recommendations
              </p>
              <ul className="space-y-2">
                {(r.recommendations as string[]).map((rec, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bids section */}
      {showBids && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Gavel className="w-3.5 h-3.5" /> Bids Received
          </p>
          <JobBids
            jobId={job.id}
            jobStatus={job.status}
            onBidAccepted={onStatusChanged}
          />
        </div>
      )}

      {/* Q&A section */}
      {(job.status === "open" || job.status === "awarded" || job.status === "in_progress") && (
        <div className="mt-6">
          <JobQuestions jobId={job.id} role="homeowner" />
        </div>
      )}

      {/* Milestones section */}
      {(job.status === "awarded" || job.status === "in_progress") && (
        <div className="mt-6">
          <MilestonesCard jobId={job.id} role="homeowner" />
        </div>
      )}

      {/* Escrow section — shown after bid accepted */}
      {(job.status === "awarded" || job.status === "in_progress" || job.status === "completed") && (
        <div className="space-y-4 mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            Payment &amp; Escrow
          </p>
          <EscrowStatusBanner
            jobId={job.id}
            onStatusLoaded={(s) => setEscrowStatus(s)}
          />
          {escrowStatus === "pending" && <EscrowPayment jobId={job.id} />}
          {escrowStatus === "held" && (
            <EscrowActions
              jobId={job.id}
              escrowStatus={escrowStatus}
              onStatusChanged={onStatusChanged}
            />
          )}
        </div>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MyProjects() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.jobs.list();
      setJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChanged = useCallback(async () => {
    await load();
    if (selectedJob) {
      try {
        const updated = await api.jobs.get(selectedJob.id);
        setSelectedJob(updated);
      } catch {
        setSelectedJob(null);
      }
    }
  }, [load, selectedJob]);

  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const activeCount = jobs.filter(
    (j) => j.status !== "completed" && j.status !== "cancelled"
  ).length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: "Total Projects",
            value: String(jobs.length),
            sub: "all time",
            icon: ClipboardList,
          },
          {
            label: "Completed",
            value: String(completedCount),
            sub: `${activeCount} active`,
            icon: CheckCircle2,
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold font-heading text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project list */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" /> My Projects
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1 h-7"
            onClick={() => navigate("/post-project")}
          >
            Post new <ArrowUpRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading projects…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <p className="text-sm text-destructive font-medium">Failed to load projects</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <PlusCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Post a video of your job and get quotes from local contractors.
                </p>
              </div>
              <Button size="sm" onClick={() => navigate("/post-project")} className="mt-1">
                Post your first project
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job) => {
                const cfg = STATUS_CONFIG[job.status];
                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {projectTitle(job)}
                        </p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(job.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold border flex items-center gap-1.5 ${cfg.classes}`}
                      >
                        <Circle className={`w-1.5 h-1.5 fill-current ${cfg.dot} rounded-full`} />
                        {cfg.label}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project detail sheet */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedJob && (
            <JobDetail
              key={selectedJob.id + selectedJob.status}
              job={selectedJob}
              onStatusChanged={handleStatusChanged}
              onClose={() => setSelectedJob(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
