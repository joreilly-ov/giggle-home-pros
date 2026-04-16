import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Gavel,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Circle,
  PoundSterling,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { api, Bid } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MilestonesCard } from "@/components/milestones/MilestonesCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bidJobTitle(bid: Bid): string {
  const trade = bid.job?.analysis_result?.trade_category as string | undefined;
  if (trade) return `${trade} Job`;
  return `Job ${bid.job_id.slice(0, 8)}…`;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string; dot: string }
> = {
  accepted: {
    label: "Accepted",
    classes:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Declined",
    classes:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500",
  },
  pending: {
    label: "Pending",
    classes:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-400",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ActiveBids() {
  const { toast } = useToast();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBid, setExpandedBid] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.bids.mine();
      setBids(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bids");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = bids.filter((b) => b.status === "pending").length;
  const acceptedCount = bids.filter((b) => b.status === "accepted").length;
  const winRate =
    bids.length > 0 ? Math.round((acceptedCount / bids.length) * 100) : 0;
  const pipelinePence = bids
    .filter((b) => b.status !== "rejected")
    .reduce((sum, b) => sum + b.amount_pence, 0);

  const pipelineFormatted = (pipelinePence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });

  const handleWithdraw = async (bid: Bid) => {
    setWithdrawingId(bid.id);
    try {
      await api.bids.withdraw(bid.job_id, bid.id);
      toast({ title: "Bid withdrawn." });
      await load();
    } catch (e) {
      toast({
        title: "Failed to withdraw bid",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Open Bids",
            value: String(pendingCount),
            sub: "awaiting response",
            icon: Gavel,
            accent: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Win Rate",
            value: `${winRate}%`,
            sub: `${acceptedCount} of ${bids.length} accepted`,
            icon: TrendingUp,
            accent: "text-green-600",
            bg: "bg-green-100 dark:bg-green-900/20",
          },
          {
            label: "Pipeline",
            value: pipelineFormatted,
            sub: "pending + accepted",
            icon: PoundSterling,
            accent: "text-amber-600",
            bg: "bg-amber-100 dark:bg-amber-900/20",
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
                <div
                  className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.accent}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bids list */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Gavel className="w-4 h-4 text-primary" /> My Bids
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1 h-7"
            onClick={load}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading bids…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <p className="text-sm text-destructive font-medium">
                Failed to load bids
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={load}>
                Retry
              </Button>
            </div>
          ) : bids.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              No bids yet. Browse the job feed and submit your first bid.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {bids.map((bid) => {
                const cfg = STATUS_CONFIG[bid.status] ?? STATUS_CONFIG.pending;
                const pounds = (bid.amount_pence / 100).toLocaleString(
                  "en-GB",
                  { style: "currency", currency: "GBP" }
                );
                return (
                  <div
                    key={bid.id}
                    className="group"
                  >
                    <div
                      className="flex items-start justify-between px-6 py-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                      onClick={() =>
                        bid.status === "accepted"
                          ? setExpandedBid(expandedBid === bid.id ? null : bid.id)
                          : undefined
                      }
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {bid.status === "accepted" ? (
                          expandedBid === bid.id ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                          )
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                            <Gavel className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {bidJobTitle(bid)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {bid.note && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {bid.note}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(bid.created_at).toLocaleDateString(
                                "en-GB",
                                { day: "numeric", month: "short" }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        {bid.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5 h-7 text-xs"
                            disabled={withdrawingId === bid.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWithdraw(bid);
                            }}
                          >
                            {withdrawingId === bid.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Withdraw
                          </Button>
                        )}
                        <span className="text-sm font-bold text-foreground">
                          {pounds}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold border flex items-center gap-1.5 ${cfg.classes}`}
                        >
                          <Circle
                            className={`w-1.5 h-1.5 fill-current ${cfg.dot} rounded-full`}
                          />
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Expanded milestones for accepted bids */}
                    {bid.status === "accepted" && expandedBid === bid.id && (
                      <div className="px-6 pb-4">
                        <MilestonesCard jobId={bid.job_id} role="contractor" />
                      </div>
                    )}
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
