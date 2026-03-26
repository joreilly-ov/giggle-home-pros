import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Clock, AlertTriangle, Flame, Eye, Gavel, Send, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { JobQuestions } from "@/components/questions/JobQuestions";
import { useToast } from "@/hooks/use-toast";

type PostedJob = {
  id: string;
  filename: string;
  created_at: string;
  trade_category: string | null;
  description: string | null;
  postcode: string | null;
  city: string | null;
  state: string | null;
  analysis_result: Record<string, unknown> | null;
};

const urgencyColor = (u: string | undefined) => {
  if (!u) return "bg-muted text-muted-foreground";
  const low = u.toLowerCase();
  if (low.includes("high") || low.includes("emergency")) return "bg-destructive/10 text-destructive";
  if (low.includes("medium")) return "bg-accent/20 text-accent-foreground";
  return "bg-primary/10 text-primary";
};

export function JobFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<PostedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedJob, setSelectedJob] = useState<PostedJob | null>(null);
  const [expertise, setExpertise] = useState<string[]>([]);

  // Bid form state
  const [bidAmount, setBidAmount] = useState("");
  const [bidNote, setBidNote] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidSubmitted, setBidSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("contractors" as any)
      .select("expertise")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setExpertise((data as any).expertise || []);
      });

    supabase
      .from("videos" as any)
      .select("id, filename, created_at, trade_category, description, postcode, city, state, analysis_result")
      .eq("status", "posted")
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(true);
        } else {
          setJobs((data as any) || []);
        }
        setLoading(false);
      });
  }, [user]);

  const handleSubmitBid = async () => {
    if (!selectedJob || !bidAmount) return;
    const pence = Math.round(parseFloat(bidAmount) * 100);
    if (isNaN(pence) || pence <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSubmittingBid(true);
    try {
      await api.bids.submit(selectedJob.id, pence, bidNote);
      setBidSubmitted(true);
      toast({ title: "Bid submitted!", description: "The homeowner will review your bid." });
    } catch (e) {
      toast({
        title: "Failed to submit bid",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmittingBid(false);
    }
  };

  const openJob = (job: PostedJob) => {
    setSelectedJob(job);
    setBidAmount("");
    setBidNote("");
    setBidSubmitted(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading jobs…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <span className="text-sm">Failed to load jobs. Try refreshing.</span>
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
          <h2 className="text-xl font-heading font-bold text-foreground">No Jobs Posted Yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            When customers post projects, they'll appear here matched to your expertise. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  const sorted = [...jobs].sort((a, b) => {
    const aMatch = expertise.some((e) => a.trade_category?.toLowerCase() === e.toLowerCase());
    const bMatch = expertise.some((e) => b.trade_category?.toLowerCase() === e.toLowerCase());
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return (
    <>
      <div className="space-y-3">
        {sorted.map((job) => {
          const analysis = job.analysis_result as Record<string, unknown> | null;
          const urgency = (analysis?.urgency as string) || undefined;
          const description = (analysis?.description ?? analysis?.likely_issue ?? analysis?.summary) as string | undefined;
          const isMatch = expertise.some((e) => job.trade_category?.toLowerCase() === e.toLowerCase());

          return (
            <div
              key={job.id}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
              onClick={() => openJob(job)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {job.trade_category && (
                      <Badge variant={isMatch ? "default" : "secondary"}>
                        {job.trade_category}
                      </Badge>
                    )}
                    {isMatch && (
                      <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
                        Matches your expertise
                      </Badge>
                    )}
                    {urgency && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${urgencyColor(urgency)}`}>
                        {urgency}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-foreground line-clamp-2">
                    {description || "Video project"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {(job.city || job.postcode) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[job.city, job.state, job.postcode].filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs group-hover:text-primary transition-colors">
                    <Eye className="w-3 h-3" /> View & Bid
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Job detail + bid dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-heading">
                  {selectedJob.trade_category || "Project"} Job
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {(() => {
                  const a = selectedJob.analysis_result as Record<string, unknown> | null;
                  const desc = (a?.description ?? selectedJob.description ?? a?.likely_issue ?? a?.summary) as string | undefined;
                  if (!a && !desc) return null;
                  return (
                    <>
                      {desc && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">AI Diagnosis</h4>
                          <p className="text-sm text-foreground">{desc}</p>
                        </div>
                      )}

                      {a && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            {a.urgency && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Urgency</h4>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${urgencyColor(a.urgency as string)}`}>
                                  {a.urgency as string}
                                </span>
                              </div>
                            )}
                            {a.location_in_home && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Location in Home</h4>
                                <p className="text-sm font-semibold text-foreground capitalize">{a.location_in_home as string}</p>
                              </div>
                            )}
                          </div>

                          {Array.isArray(a.materials_involved) && a.materials_involved.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Materials</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {(a.materials_involved as string[]).map((m, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {Array.isArray(a.clarifying_questions) && a.clarifying_questions.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Questions to Ask</h4>
                              <ul className="space-y-1">
                                {(a.clarifying_questions as string[]).map((q, i) => (
                                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span> {q}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}

                {(selectedJob.city || selectedJob.postcode) && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Location</h4>
                    <p className="text-sm text-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {[selectedJob.city, selectedJob.state, selectedJob.postcode].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Posted {formatDistanceToNow(new Date(selectedJob.created_at), { addSuffix: true })}
                </p>

                {/* Q&A section */}
                <JobQuestions jobId={selectedJob.id} role="contractor" />

                {/* Bid form */}
                <div className="border-t border-border pt-4 mt-2">
                  {bidSubmitted ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <p className="text-sm font-semibold text-foreground">Bid Submitted!</p>
                      <p className="text-xs text-muted-foreground">The homeowner will review your bid and respond.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-heading font-semibold text-foreground">Submit Your Bid</h4>
                      </div>
                      <div>
                        <Label htmlFor="bid-amount" className="text-xs text-muted-foreground">
                          Your Quote (£)
                        </Label>
                        <Input
                          id="bid-amount"
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="e.g. 250.00"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bid-note" className="text-xs text-muted-foreground">
                          Note to Homeowner (optional)
                        </Label>
                        <Textarea
                          id="bid-note"
                          placeholder="Describe your approach, timeline, experience with this type of work…"
                          value={bidNote}
                          onChange={(e) => setBidNote(e.target.value)}
                          rows={3}
                          className="mt-1 resize-none"
                        />
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={handleSubmitBid}
                        disabled={submittingBid || !bidAmount}
                      >
                        {submittingBid ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Submit Bid
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
