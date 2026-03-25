import { useState, useEffect, useCallback } from "react";
import { api, EscrowStatusValue } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";

const STATUS_DISPLAY: Record<
  EscrowStatusValue,
  { label: string; icon: typeof ShieldCheck; classes: string }
> = {
  pending: {
    label: "Payment not yet made",
    icon: Clock,
    classes: "bg-secondary text-muted-foreground border-border",
  },
  held: {
    label: "Payment held securely in escrow",
    icon: ShieldCheck,
    classes:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
  },
  funds_released: {
    label: "Payment released to contractor",
    icon: CheckCircle2,
    classes: "bg-primary/10 text-primary border-primary/20",
  },
  refunded: {
    label: "Payment refunded",
    icon: RotateCcw,
    classes:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  },
};

interface EscrowStatusBannerProps {
  jobId: string;
  onStatusLoaded?: (status: EscrowStatusValue) => void;
}

export function EscrowStatusBanner({ jobId, onStatusLoaded }: EscrowStatusBannerProps) {
  const [status, setStatus] = useState<EscrowStatusValue | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.escrow.get(jobId);
      setStatus(data.job_escrow_status);
      onStatusLoaded?.(data.job_escrow_status);
    } catch {
      // No escrow yet — treat as pending
      setStatus("pending");
      onStatusLoaded?.("pending");
    } finally {
      setLoading(false);
    }
  }, [jobId, onStatusLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Checking payment status…
      </div>
    );
  }

  if (!status) return null;

  const cfg = STATUS_DISPLAY[status];
  const Icon = cfg.icon;

  return (
    <Badge
      variant="outline"
      className={`text-xs font-semibold border flex items-center gap-1.5 w-fit ${cfg.classes}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </Badge>
  );
}
