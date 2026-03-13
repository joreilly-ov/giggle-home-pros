import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Video, Loader2, AlertTriangle, CheckCircle, X, Wrench, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import { TRADE_CATEGORIES } from "@/components/photo-analyzer/types";


type VideoAnalysisResult = {
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
  [key: string]: unknown;
};

const MAX_FILE_SIZE = 400 * 1024 * 1024; // 400MB

const VideoAnalyzer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [tradeCategory, setTradeCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please select a video file.", variant: "destructive" });
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 400MB. Contact us if you need a higher limit.", variant: "destructive" });
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
      if (dropped.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: "Maximum file size is 400MB. Contact us if you need a higher limit.", variant: "destructive" });
        return;
      }
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
          // Location not available
        }
      }

      setProgress(30);

      const response = await fetch("https://stable-gig-374485351183.europe-west1.run.app/analyse", {
        method: "POST",
        body: formData,
      });

      setProgress(90);

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `Server error ${response.status}`);
      if (data?.error) throw new Error(data.error);

      setResult(data as VideoAnalysisResult);
      setProgress(100);
      toast({ title: "Analysis complete!", description: "Your video has been processed." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen page-bg">
      <Navbar variant="solid" />

      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto flex items-center h-14 px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-heading font-bold text-foreground">Video Analyzer</h1>
            <p className="text-xs text-muted-foreground">Upload a video for AI-powered diagnosis</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <p className="text-foreground font-medium mb-1">Drag & drop your video here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse · MP4, MOV, WebM · Max 400MB
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Need a higher limit? <a href="/contact" className="text-primary underline">Contact us</a>
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
                  <video src={videoPreview!} controls className="w-full max-h-[400px] object-contain" />
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
                  <label className="text-sm font-medium text-foreground">Describe the problem (optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Water is leaking from under the kitchen sink..."
                    maxLength={1000}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">{description.trim().length}/1000 characters</p>
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
                        <SelectItem key={cat.value} value={cat.value || "_auto"}>
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

                <Button onClick={analyseVideo} disabled={uploading} className="w-full gap-2" size="lg">
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analysing...</>
                  ) : (
                    <><Video className="w-4 h-4" /> Analyse Video</>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Analysis Complete</h2>
                <p className="text-muted-foreground">Here's what our AI found</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(result.likely_issue || result.summary) && (
                <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Likely Issue</h3>
                  <p className="text-foreground text-lg font-semibold">{result.likely_issue || result.summary}</p>
                </div>
              )}

              {result.urgency_score != null && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Urgency</h3>
                  <div className="flex items-center gap-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      result.urgency_score >= 8
                        ? "bg-destructive/10 text-destructive"
                        : result.urgency_score >= 5
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {result.urgency_score >= 8 ? "High" : result.urgency_score >= 5 ? "Medium" : "Low"} ({result.urgency_score}/10)
                    </span>
                  </div>
                </div>
              )}

              {!result.urgency_score && result.urgency && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Urgency</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    result.urgency.toLowerCase().includes("high")
                      ? "bg-destructive/10 text-destructive"
                      : result.urgency.toLowerCase().includes("medium")
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : "bg-primary/10 text-primary"
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

              {result.materials && result.materials.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Materials Needed</h3>
                  <ul className="space-y-1">
                    {result.materials.map((m, i) => (
                      <li key={i} className="text-foreground text-sm flex items-start gap-2">
                        <Package className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> {m}
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
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={clearFile} className="gap-2">
                <Upload className="w-4 h-4" /> Upload Another
              </Button>
              <Button onClick={() => navigate("/")}>Back Home</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoAnalyzer;
