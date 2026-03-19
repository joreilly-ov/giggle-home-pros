import { CheckCircle, AlertTriangle, Wrench, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnalysisResult, PhotoFile } from "./types";
import PhotoGrid from "./PhotoGrid";
import TaskBreakdown from "./TaskBreakdown";

type Props = {
  result: AnalysisResult;
  photos: PhotoFile[];
  onClear: () => void;
};

const urgencyColor = (score: number) => {
  if (score >= 8) return "bg-destructive/10 text-destructive";
  if (score >= 5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-primary/10 text-primary";
};

const urgencyLabel = (score: number) => {
  if (score >= 8) return "High";
  if (score >= 5) return "Medium";
  return "Low";
};

const AnalysisResults = ({ result, photos, onClear }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Analysis Complete</h2>
          <p className="text-muted-foreground">{photos.length} photo{photos.length > 1 ? "s" : ""} analysed</p>
        </div>
      </div>

      {/* Photo grid with feedback overlays */}
      {result.image_feedback && result.image_feedback.length > 0 && (
        <PhotoGrid photos={photos} onRemove={() => {}} onAddMore={() => {}} imageFeedback={result.image_feedback} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {result.likely_issue && (
          <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Likely Issue</h3>
            <p className="text-foreground text-lg font-semibold">{result.likely_issue}</p>
          </div>
        )}

        {result.urgency_score != null && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Urgency</h3>
            <div className="flex items-center gap-3">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${urgencyColor(result.urgency_score)}`}>
                {urgencyLabel(result.urgency_score)} ({result.urgency_score}/10)
              </span>
            </div>
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
      </div>

      <TaskBreakdown
        description={result.likely_issue || ""}
        urgency={result.urgency_score != null ? String(result.urgency_score) : undefined}
        requiredTools={result.required_tools}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClear} className="gap-2">
          <Camera className="w-4 h-4" /> Analyse More Photos
        </Button>
        <Button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AnalysisResults;
