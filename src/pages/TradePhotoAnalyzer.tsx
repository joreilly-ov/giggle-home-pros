import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Camera, Loader2, AlertTriangle, ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import PhotoGrid from "@/components/photo-analyzer/PhotoGrid";
import AnalysisResults from "@/components/photo-analyzer/AnalysisResults";
import { PhotoFile, AnalysisResult, TRADE_CATEGORIES, MAX_PHOTOS, MAX_FILE_SIZE, ACCEPTED_TYPES } from "@/components/photo-analyzer/types";
import { supabase } from "@/integrations/supabase/client";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const TradePhotoAnalyzer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [description, setDescription] = useState("");
  const [tradeCategory, setTradeCategory] = useState("");
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
    setDescription("");
    setTradeCategory("");
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analysePhotos = async () => {
    if (photos.length === 0) return;
    if (description.trim().length < 10) {
      toast({ title: "Description too short", description: "Please describe the problem in at least 10 characters.", variant: "destructive" });
      return;
    }

    setAnalysing(true);
    setError(null);

    try {
      const images = await Promise.all(photos.map((p) => fileToBase64(p.file)));

      const payload: Record<string, unknown> = {
        images,
        description: description.trim(),
      };
      if (tradeCategory) payload.trade_category = tradeCategory;

      const { data, error: fnError } = await supabase.functions.invoke("analyse-photos", {
        body: payload,
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setResult(data as AnalysisResult);
      toast({ title: "Analysis complete!", description: `${photos.length} photo(s) processed.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setAnalysing(false);
    }
  };

  const descriptionValid = description.trim().length >= 10;

  return (
    <div className="min-h-screen page-bg">
      <Navbar variant="solid" />

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
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                Snap it. Upload it. Know what's wrong.
              </h2>
              <p className="text-muted-foreground">
                Upload up to {MAX_PHOTOS} photos of the problem area. Our AI will quickly check if the issue is clear and provide a preliminary diagnosis.
              </p>
            </div>

            {/* Drop zone / grid */}
            <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className="space-y-4">
              {photos.length > 0 && (
                <PhotoGrid photos={photos} onRemove={removePhoto} onAddMore={() => fileInputRef.current?.click()} />
              )}

              {photos.length === 0 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-1">Drag & drop your photos here</p>
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

            {/* Description */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Describe the problem *</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Water is leaking from under the kitchen sink, seems to come from the pipe joint..."
                  maxLength={1000}
                  className="min-h-[100px]"
                />
                <p className={`text-xs ${descriptionValid ? "text-muted-foreground" : "text-destructive"}`}>
                  {description.trim().length}/1000 characters (min 10)
                </p>
              </div>
            )}

            {/* Trade category */}
            {photos.length > 0 && (
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
            )}

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

            {error && (
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Analysis failed</p>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            )}

            {photos.length > 0 && (
              <Button
                onClick={analysePhotos}
                disabled={analysing || !descriptionValid}
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
          <AnalysisResults result={result} photos={photos} onClear={clearAll} />
        )}
      </main>
    </div>
  );
};

export default TradePhotoAnalyzer;
