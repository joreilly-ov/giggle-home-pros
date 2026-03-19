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
  CheckCircle2,
  Clock,
  Star,
  Video,
  Circle,
  PlusCircle,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
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
    const name = v.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    return name.charAt(0).toUpperCase() + name.slice(1);
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
                const status = v.analysis_result ? "active" : "pending";
                const cfg = STATUS_CONFIG[status];
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors"
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

                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold border flex items-center gap-1.5 shrink-0 ml-4 ${cfg.classes}`}
                    >
                      <Circle className={`w-1.5 h-1.5 fill-current ${cfg.dot} rounded-full`} />
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
