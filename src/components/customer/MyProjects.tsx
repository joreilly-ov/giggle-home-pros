import { useEffect, useState } from "react";
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
  Video,
  Circle,
  PlusCircle,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ReviewMediator } from "@/components/ReviewMediator";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoProject {
  id: string;
  filename: string;
  created_at: string;
  analysis_result: Record<string, unknown> | null;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: {
    label: "In Progress",
    classes: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  pending: {
    label: "Awaiting Bids",
    classes: "bg-accent/50 text-accent-foreground border-accent/30",
    dot: "bg-accent-foreground/60",
  },
  completed: {
    label: "Completed",
    classes: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function MyProjects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    jobId: string;
    contractorId: string;
    title: string;
    escrowStatus: string;
  } | null>(null);
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("videos")
      .select("id, filename, created_at, analysis_result")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setVideos((data as VideoProject[]) ?? []);
        }
        setLoading(false);
      });
  }, [user]);

  const activeVideos = videos.filter((v) => !v.analysis_result);
  const analyzedVideos = videos.filter((v) => v.analysis_result);

  const totalProjects = videos.length;
  const completedCount = analyzedVideos.length;

  function projectTitle(v: VideoProject): string {
    const trade = v.analysis_result?.trade_category as string | undefined;
    const date = new Date(v.created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "short",
    });
    if (trade) return `${trade} Issue – ${date}`;
    return `Home Project – ${date}`;
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: "Total Projects",
            value: String(totalProjects),
            sub: "all time",
            icon: ClipboardList,
            accent: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Completed",
            value: String(completedCount),
            sub: `${activeVideos.length} still active`,
            icon: CheckCircle2,
            accent: "text-primary",
            bg: "bg-primary/10",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold font-heading text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.accent}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active projects from videos */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" /> My Posted Projects
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
          ) : videos.length === 0 ? (
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
              {videos.map((v) => {
                const hasAnalysis = !!v.analysis_result;
                const status = hasAnalysis ? "active" : "pending";
                const cfg = STATUS_CONFIG[status];
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedProject(v)}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                        <Video className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {projectTitle(v)}
                        </p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(v.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
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
      <Sheet open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedProject && (() => {
            const r = selectedProject.analysis_result as Record<string, unknown> | null;
            const urgency = r?.urgency as string | undefined;
            return (
              <>
                <SheetHeader className="mb-6">
                  <SheetTitle className="font-heading">{projectTitle(selectedProject)}</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    Posted {new Date(selectedProject.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </SheetHeader>

                {!r ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground">Analysis in progress…</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {r.summary && (
                      <div className="bg-card border border-border rounded-xl p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary</p>
                        <p className="text-sm text-foreground">{r.summary as string}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {urgency && (
                        <div className="bg-card border border-border rounded-xl p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Urgency</p>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            urgency.toLowerCase().includes("high")
                              ? "bg-destructive/10 text-destructive"
                              : urgency.toLowerCase().includes("medium")
                              ? "bg-accent/10 text-accent-foreground"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {urgency}
                          </span>
                        </div>
                      )}

                      {r.trade_category && (
                        <div className="bg-card border border-border rounded-xl p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trade</p>
                          <p className="text-sm font-semibold text-foreground">{r.trade_category as string}</p>
                        </div>
                      )}

                      {r.estimated_cost_range && (
                        <div className="col-span-2 bg-card border border-border rounded-xl p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Estimated Cost</p>
                          <p className="text-sm font-semibold text-foreground">{r.estimated_cost_range as string}</p>
                        </div>
                      )}
                    </div>

                    {Array.isArray(r.materials) && r.materials.length > 0 && (
                      <div className="bg-card border border-border rounded-xl p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Materials Needed</p>
                        <ul className="space-y-1.5">
                          {(r.materials as string[]).map((m, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span> {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(r.recommendations) && r.recommendations.length > 0 && (
                      <div className="bg-card border border-border rounded-xl p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recommendations</p>
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
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Review sheet — ready for when real completed jobs with contractor assignments exist */}
      <Sheet open={!!reviewTarget} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading">
              Rate: {reviewTarget?.title}
            </SheetTitle>
          </SheetHeader>
          {reviewTarget && (
            <ReviewMediator
              contractorId={reviewTarget.contractorId}
              jobId={reviewTarget.jobId}
              escrowStatus={reviewTarget.escrowStatus}
              mode="form"
              onSuccess={() => setReviewTarget(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
