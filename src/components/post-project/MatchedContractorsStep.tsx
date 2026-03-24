import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ContractorMatch, MatchResponse } from "@/lib/api";
import { Loader2, Shield, Users, CheckCircle } from "lucide-react";

interface Props {
  matchData: MatchResponse;
  onPublish: () => Promise<void>;
}

export function MatchedContractorsStep({ matchData, onPublish }: Props) {
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onPublish();
    } finally {
      setPublishing(false);
    }
  };

  const { strategy, contractors } = matchData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">Matched Contractors</h2>
          <p className="text-sm text-muted-foreground">
            {strategy === "embedding"
              ? `${contractors.length} contractors matched by AI`
              : `${contractors.length} contractors in your trade area`}
          </p>
        </div>
      </div>

      {contractors.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No contractors matched yet</p>
          <p className="text-sm mt-1">Publishing your job will make it visible to all contractors in your area.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contractors.map((c) => (
            <ContractorCard key={c.contractor_id} contractor={c} showScore={strategy === "embedding"} />
          ))}
        </div>
      )}

      <Button onClick={handlePublish} disabled={publishing} className="w-full gap-2" size="lg">
        {publishing ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
        ) : (
          <><CheckCircle className="w-4 h-4" /> Publish job &amp; invite bids</>
        )}
      </Button>
    </div>
  );
}

function ContractorCard({ contractor, showScore }: { contractor: ContractorMatch; showScore: boolean }) {
  const score = Math.round((contractor.match_score ?? 0) * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-heading font-bold text-lg">
        {contractor.business_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground">{contractor.business_name}</span>
          {contractor.insurance_verified && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs gap-1">
              <Shield className="w-3 h-3" /> Insured
            </Badge>
          )}
        </div>

        {contractor.trade_activities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {contractor.trade_activities.map((t) => (
              <Badge key={t} variant="outline" className="text-xs capitalize">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {contractor.years_experience != null && (
          <p className="text-xs text-muted-foreground">{contractor.years_experience} years experience</p>
        )}

        {showScore && contractor.match_score != null && (
          <div className="flex items-center gap-2">
            <Progress value={score} className="h-2 flex-1" />
            <span className="text-xs font-medium text-primary">{score}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
