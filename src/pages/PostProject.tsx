import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, ArrowLeft, CheckCircle, AlertTriangle, Loader2, X } from "lucide-react";

type AnalysisResult = {
  summary?: string;
  likely_issue?: string;
  urgency?: string;
  urgency_score?: number;
  trade_category?: string;
  materials?: string[];
  estimated_cost_range?: string;
  recommendations?: string[];
  required_tools?: string[];
  estimated_parts?: string[];
  video_metadata?: Record<string, unknown>;
  description?: string;
  location_in_home?: string;
  materials_components_visible?: string[];
  clarifying_questions?: string[];
  [key: string]: unknown;
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const PostProject = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Analysis failed (${response.status})`);
      }

      const data = await response.json() as AnalysisResult;
      setResult(data);
      setProgress(100);

      // Save analysis to videos table
      if (user) {
        // Fetch customer location for the job posting
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
          trade_category: data.trade_category || null,
          description: data.likely_issue || data.summary || null,
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

  return (
    <div className="min-h-screen bg-background">
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
              <CheckCircle className="w-8 h-8 text-success" />
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Analysis Complete</h2>
                <p className="text-muted-foreground">Here's what our AI found</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {result.summary && (
                <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Summary</h3>
                  <p className="text-foreground">{result.summary}</p>
                </div>
              )}

              {result.urgency && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Urgency</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    result.urgency.toLowerCase().includes("high")
                      ? "bg-destructive/10 text-destructive"
                      : result.urgency.toLowerCase().includes("medium")
                      ? "bg-accent/10 text-accent"
                      : "bg-success/10 text-success"
                  }`}>
                    {result.urgency}
                  </span>
                </div>
              )}

              {result.trade_category && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Trade Category</h3>
                  <p className="text-foreground font-semibold">{result.trade_category}</p>
                </div>
              )}

              {result.estimated_cost_range && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Estimated Cost</h3>
                  <p className="text-foreground font-semibold">{result.estimated_cost_range}</p>
                </div>
              )}

              {result.materials && result.materials.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Materials Needed</h3>
                  <ul className="space-y-1">
                    {result.materials.map((m, i) => (
                      <li key={i} className="text-foreground text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Recommendations</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-foreground text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  // Update the most recent draft to 'posted'
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
