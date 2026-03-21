import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, ArrowLeft, CheckCircle, AlertTriangle, Loader2, X, Wrench, Package } from "lucide-react";
import { TRADE_CATEGORIES } from "@/components/photo-analyzer/types";
import TaskBreakdown from "@/components/photo-analyzer/TaskBreakdown";

type VideoMetadata = {
  duration_seconds?: number;
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  location_source?: string;
};

type AnalysisResult = {
  // Actual Gemini response fields
  problem_type?: string;
  description?: string;
  location_in_home?: string;
  urgency?: string; // "low" | "medium" | "high" | "emergency"
  materials_involved?: string[];
  clarifying_questions?: string[];
  video_metadata?: VideoMetadata;
  // Legacy/fallback fields the UI also checks
  summary?: string;
  likely_issue?: string;
  urgency_score?: number;
  trade_category?: string;
  materials?: string[];
  estimated_cost_range?: string;
  recommendations?: string[];
  required_tools?: string[];
  estimated_parts?: string[];
  materials_components_visible?: string[];
  [key: string]: unknown;
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const URGENCY_STYLES: Record<string, { bg: string; label: string }> = {
  emergency: { bg: "bg-destructive/10 text-destructive", label: "🚨 Emergency" },
  high: { bg: "bg-destructive/10 text-destructive", label: "High" },
  medium: { bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", label: "Medium" },
  low: { bg: "bg-primary/10 text-primary", label: "Low" },
};

const getUrgencyStyle = (urgency: string) => {
  const key = urgency.toLowerCase();
  return URGENCY_STYLES[key] || { bg: "bg-muted text-muted-foreground", label: urgency };
};

const PostProject = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [tradeCategory, setTradeCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please select a video file.", variant: "destructive" });
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 100MB.", variant: "destructive" });
      return;
    }

    setFile(selected);
    setVideoPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) {
      setFile(dropped);
      setVideoPreview(URL.createObjectURL(dropped));
      setResult(null);
      setError(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setDescription("");
    setTradeCategory("");
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyseVideo = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (description.trim().length >= 10) {
        formData.append("description", description.trim());
      }
      if (tradeCategory && tradeCategory !== "_auto") {
        formData.append("trade_category", tradeCategory);
      }

      // Try to get browser location
      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          formData.append("browser_lat", pos.coords.latitude.toString());
          formData.append("browser_lon", pos.coords.longitude.toString());
        } catch {
          // Location not available, continue without
        }
      }

      setProgress(30);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        "https://stable-gig-374485351183.europe-west1.run.app/analyse",
        {
          method: "POST",
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      setProgress(90);

      const data = await response.json();
      console.log("[PostProject] API response:", JSON.stringify(data, null, 2));

      if (!response.ok) throw new Error(data?.error || `Analysis failed (${response.status})`);
      if (data?.error) throw new Error(data.error);

      setResult(data as AnalysisResult);
      setProgress(100);

      // Save analysis to videos table
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("postcode, city, state")
          .eq("id", user.id)
          .maybeSingle();

        await supabase.from("videos" as any).insert({
          user_id: user.id,
          filename: file.name,
          analysis_result: data,
          status: "draft",
          trade_category: data.problem_type || data.trade_category || null,
          description: data.description || data.likely_issue || data.summary || null,
          postcode: profile?.postcode || null,
          city: profile?.city || null,
          state: profile?.state || null,
        } as any);
      }

      toast({ title: "Analysis complete!", description: "Your video has been processed." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return null;

  // Resolve actual Gemini fields with legacy fallbacks
  const displayDescription = result?.description || result?.likely_issue || result?.summary;
  const displayProblemType = result?.problem_type || result?.trade_category;
  const displayMaterials = result?.materials_involved || result?.materials || result?.materials_components_visible;
  const displayUrgency = result?.urgency;

  return (
    <div className="min-h-screen page-bg">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto flex items-center h-16 px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-heading font-bold text-foreground">Post a Project</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Upload area */}
        {!result && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                Show us what needs fixing
              </h2>
              <p className="text-muted-foreground">
                Record a short video of the problem area. Our AI will analyse it and suggest the right trades and estimated costs.
              </p>
            </div>

            {!file ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium mb-1">
                  Drag & drop your video here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse · MP4, MOV, WebM · Max 100MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-secondary">
                  <video
                    src={videoPreview!}
                    controls
                    className="w-full max-h-[400px] object-contain"
                  />
                  <button
                    onClick={clearFile}
                    className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-4">
                  <Video className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Describe the problem <span className="text-muted-foreground font-normal">(min 10 characters)</span>
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Water is leaking from under the kitchen sink when the tap is running..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Trade category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Trade category</label>
                  <Select value={tradeCategory} onValueChange={setTradeCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-detect (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value || "_auto"} value={cat.value || "_auto"}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analysing your video — this may take a minute...
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Analysis failed</p>
                      <p className="text-sm text-destructive/80">{error}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={analyseVideo}
                  disabled={uploading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analysing...
                    </>
                  ) : (
                    <>Analyse Video</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Analysis Complete</h2>
                <p className="text-muted-foreground">Here's what our AI found</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Description — main text block */}
              {displayDescription && (
                <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">What We Found</h3>
                  <p className="text-foreground text-lg font-semibold">{displayDescription}</p>
                </div>
              )}

              {/* Urgency badge */}
              {displayUrgency && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Urgency</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getUrgencyStyle(displayUrgency).bg}`}>
                    {getUrgencyStyle(displayUrgency).label}
                  </span>
                </div>
              )}

              {/* Problem Type / Trade Category */}
              {displayProblemType && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Trade Category</h3>
                  <p className="text-foreground font-semibold capitalize">{displayProblemType}</p>
                </div>
              )}

              {/* Location in Home */}
              {result.location_in_home && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Location in Home</h3>
                  <p className="text-foreground font-semibold capitalize">{result.location_in_home}</p>
                </div>
              )}

              {/* Estimated Cost (if backend ever adds it) */}
              {result.estimated_cost_range && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Estimated Cost</h3>
                  <p className="text-foreground font-semibold">{result.estimated_cost_range}</p>
                </div>
              )}

              {/* Materials Involved — shown as tags */}
              {displayMaterials && displayMaterials.length > 0 && (
                <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Materials Involved</h3>
                  <div className="flex flex-wrap gap-2">
                    {displayMaterials.map((m, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-foreground text-sm font-medium">
                        <Package className="w-3.5 h-3.5 text-primary" /> {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Tools */}
              {result.required_tools && result.required_tools.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Required Tools</h3>
                  <ul className="space-y-1">
                    {result.required_tools.map((tool, i) => (
                      <li key={i} className="text-foreground text-sm flex items-start gap-2">
                        <Wrench className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Estimated Parts */}
              {result.estimated_parts && result.estimated_parts.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Estimated Parts</h3>
                  <ul className="space-y-1">
                    {result.estimated_parts.map((part, i) => (
                      <li key={i} className="text-foreground text-sm flex items-start gap-2">
                        <Package className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> {part}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Recommendations</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-foreground text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clarifying Questions — checklist for the tradesman */}
              {result.clarifying_questions && result.clarifying_questions.length > 0 && (
                <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Questions for the Contractor</h3>
                  <ul className="space-y-3">
                    {result.clarifying_questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-3 text-foreground text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Video Metadata */}
              {result.video_metadata && (
                <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Video Details</h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    {result.video_metadata.duration_seconds != null && (
                      <span>Duration: {Math.round(result.video_metadata.duration_seconds)}s</span>
                    )}
                    {result.video_metadata.width && result.video_metadata.height && (
                      <span>Resolution: {result.video_metadata.width}×{result.video_metadata.height}</span>
                    )}
                    {result.video_metadata.latitude != null && result.video_metadata.longitude != null && (
                      <span>GPS: {result.video_metadata.latitude.toFixed(4)}, {result.video_metadata.longitude.toFixed(4)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Task Breakdown */}
            <TaskBreakdown
              description={displayDescription || ""}
              urgency={displayUrgency}
              requiredTools={result.required_tools}
            />

            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  if (user) {
                    const { data: drafts } = await supabase
                      .from("videos" as any)
                      .select("id")
                      .eq("user_id", user.id)
                      .eq("status", "draft")
                      .order("created_at", { ascending: false })
                      .limit(1);

                    if (drafts && drafts.length > 0) {
                      await supabase
                        .from("videos" as any)
                        .update({ status: "posted" } as any)
                        .eq("id", (drafts[0] as any).id);
                    }
                  }
                  toast({ title: "Project posted!", description: "Contractors can now see and bid on your project." });
                  navigate("/dashboard");
                }}
                className="gap-2 flex-1"
                size="lg"
              >
                <CheckCircle className="w-4 h-4" /> Post to Contractors
              </Button>
              <Button variant="outline" onClick={clearFile} className="gap-2">
                <Upload className="w-4 h-4" /> Upload Another
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PostProject;
