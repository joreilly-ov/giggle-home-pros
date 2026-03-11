import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, Camera, Loader2, CheckCircle, AlertTriangle, ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per photo
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

type PhotoFile = {
  file: File;
  preview: string;
  id: string;
};

type AnalysisResult = {
  summary?: string;
  urgency?: string;
  trade_category?: string;
  estimated_cost_range?: string;
  recommendations?: string[];
  issues_detected?: string[];
  [key: string]: unknown;
};

const TradePhotoAnalyzer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPhotos = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast({ title: "Limit reached", description: `Maximum ${MAX_PHOTOS} photos allowed.`, variant: "destructive" });
      return;
    }

    const valid: PhotoFile[] = [];
    for (const f of incoming.slice(0, remaining)) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast({ title: "Invalid file", description: `${f.name} is not a supported image format.`, variant: "destructive" });
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${f.name} exceeds 10MB limit.`, variant: "destructive" });
        continue;
      }
      valid.push({ file: f, preview: URL.createObjectURL(f), id: crypto.randomUUID() });
    }
    setPhotos((prev) => [...prev, ...valid]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addPhotos(e.dataTransfer.files);
  };

  const clearAll = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analysePhotos = async () => {
    if (photos.length === 0) return;
    setAnalysing(true);
    setError(null);

    try {
      // Placeholder — backend not done yet
      await new Promise((resolve) => setTimeout(resolve, 2500));

      setResult({
        summary: "This is a placeholder analysis. The backend endpoint for photo analysis is not yet connected.",
        urgency: "Medium",
        trade_category: "General Maintenance",
        estimated_cost_range: "$150 – $400",
        issues_detected: [
          "Visible wear on surface material",
          "Potential moisture damage detected",
          "Minor structural concern noted",
        ],
        recommendations: [
          "Schedule a professional inspection within 2 weeks",
          "Document any changes with follow-up photos",
          "Avoid DIY repairs until assessed by a licensed tradesperson",
        ],
      });

      toast({ title: "Analysis complete!", description: `${photos.length} photo(s) processed.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto flex items-center h-14 px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-heading font-bold text-foreground">Photo Analyzer</h1>
            <p className="text-xs text-muted-foreground">Upload photos for a quick AI assessment</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
          <div className="space-y-6">
            {/* Intro */}
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                Snap it. Upload it. Know what's wrong.
              </h2>
              <p className="text-muted-foreground">
                Upload up to {MAX_PHOTOS} photos of the problem area. Our AI will quickly check if the issue is clear and provide a preliminary diagnosis — faster and cheaper than video analysis.
              </p>
            </div>

            {/* Drop zone / grid */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="space-y-4"
            >
              {/* Photo grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-secondary">
                      <img
                        src={p.preview}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePhoto(p.id)}
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5 text-foreground" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent p-2">
                        <p className="text-xs text-primary-foreground truncate">{p.file.name}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add more slot */}
                  {photos.length < MAX_PHOTOS && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <Camera className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add more</span>
                    </button>
                  )}
                </div>
              )}

              {/* Empty state drop zone */}
              {photos.length === 0 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-1">
                    Drag & drop your photos here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse · JPG, PNG, WebP · Max 10MB each · Up to {MAX_PHOTOS} photos
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => e.target.files && addPhotos(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Status bar */}
            {photos.length > 0 && (
              <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground font-medium">
                    {photos.length} / {MAX_PHOTOS} photos selected
                  </span>
                </div>
                <button onClick={clearAll} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
                  Clear all
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Analysis failed</p>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            )}

            {/* Analyse button */}
            {photos.length > 0 && (
              <Button
                onClick={analysePhotos}
                disabled={analysing}
                className="w-full gap-2"
                size="lg"
              >
                {analysing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analysing {photos.length} photo{photos.length > 1 ? "s" : ""}...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> Analyse {photos.length} Photo{photos.length > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-success" />
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Analysis Complete</h2>
                <p className="text-muted-foreground">{photos.length} photo{photos.length > 1 ? "s" : ""} analysed</p>
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

              {result.issues_detected && result.issues_detected.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Issues Detected</h3>
                  <ul className="space-y-1">
                    {result.issues_detected.map((issue, i) => (
                      <li key={i} className="text-foreground text-sm flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" /> {issue}
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
              <Button variant="outline" onClick={clearAll} className="gap-2">
                <Camera className="w-4 h-4" /> Analyse More Photos
              </Button>
              <Button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TradePhotoAnalyzer;
