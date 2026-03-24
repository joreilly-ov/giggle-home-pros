import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RfpDocument } from "@/lib/api";
import { Loader2, FileText, AlertTriangle, PoundSterling, CheckCircle } from "lucide-react";

interface Props {
  rfp: RfpDocument;
  onFindContractors: () => Promise<void>;
}

export function RfpReviewStep({ rfp, onFindContractors }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onFindContractors();
    } finally {
      setLoading(false);
    }
  };

  const low = (rfp.cost_estimate.low / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" });
  const high = (rfp.cost_estimate.high / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">Your Project Brief</h2>
          <p className="text-sm text-muted-foreground">Review before finding contractors</p>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Executive Summary</h3>
        <p className="text-foreground leading-relaxed">{rfp.executive_summary}</p>
      </div>

      {/* Scope of Work */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Scope of Work</h3>
        <p className="text-foreground leading-relaxed whitespace-pre-line">{rfp.scope_of_work}</p>
      </div>

      {/* Cost Estimate */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Estimated Cost Range</h3>
        <div className="flex items-center gap-2">
          <PoundSterling className="w-5 h-5 text-primary" />
          <span className="text-2xl font-heading font-bold text-foreground">{low} – {high}</span>
        </div>
      </div>

      {/* Permit Warning */}
      {rfp.permit_required && (
        <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">Permit May Be Required</p>
            {rfp.permit_notes && (
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">{rfp.permit_notes}</p>
            )}
          </div>
        </div>
      )}

      <Button onClick={handleClick} disabled={loading} className="w-full gap-2" size="lg">
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Finding contractors…</>
        ) : (
          <><CheckCircle className="w-4 h-4" /> Looks good — find contractors</>
        )}
      </Button>
    </div>
  );
}
