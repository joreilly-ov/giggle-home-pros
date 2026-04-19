import { useEffect, useState } from "react";
import { api, type ContractorDocument, type DocumentType } from "@/lib/api";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedDocsBadgeProps {
  contractorId: string;
}

const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  insurance: "Insurance",
  licence: "Licence",
  certification: "Certification",
  other: "Other",
};

export function VerifiedDocsBadge({ contractorId }: VerifiedDocsBadgeProps) {
  const [docs, setDocs] = useState<ContractorDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.documents
      .listPublic(contractorId)
      .then((list) => {
        if (!cancelled) setDocs(list);
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contractorId]);

  if (loading || docs.length === 0) return null;

  const count = docs.length;
  const types = [...new Set(docs.map((d) => d.document_type))];
  const typeLabels = types.map((t) => DOC_TYPE_LABEL[t]).join(", ");

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 shrink-0 cursor-help"
          >
            <ShieldCheck className="w-3 h-3 mr-1" />
            {count} verified credential{count !== 1 ? "s" : ""}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">Verified documents:</p>
          <p className="text-muted-foreground">{typeLabels}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
