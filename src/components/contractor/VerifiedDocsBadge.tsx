import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerifiedDocsBadgeProps {
  contractorId: string;
}

export function VerifiedDocsBadge({ contractorId }: VerifiedDocsBadgeProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.documents
      .listPublic(contractorId)
      .then((docs) => {
        if (!cancelled) setCount(docs.length);
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contractorId]);

  if (loading || count === null || count === 0) return null;

  return (
    <Badge
      variant="outline"
      className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 shrink-0"
    >
      <ShieldCheck className="w-3 h-3 mr-1" />
      {count} verified credential{count !== 1 ? "s" : ""}
    </Badge>
  );
}
