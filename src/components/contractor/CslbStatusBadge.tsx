import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CslbStatusBadgeProps {
  contractorId: string;
  /** "compact" shows only icon + short label (for cards). "full" shows licence #. */
  variant?: "compact" | "full";
}

interface CslbDetails {
  cslb_licence_number: string | null;
  licence_status: string | null;
  licence_verified_at: string | null;
}

const isClear = (status: string | null | undefined) =>
  !!status && /^\s*clear\s*$/i.test(status);

export function CslbStatusBadge({ contractorId, variant = "compact" }: CslbStatusBadgeProps) {
  const [details, setDetails] = useState<CslbDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("contractor_details")
        .select("cslb_licence_number, licence_status, licence_verified_at")
        .eq("id", contractorId)
        .maybeSingle();
      if (!cancelled) {
        setDetails(data ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractorId]);

  if (loading || !details || !details.cslb_licence_number) return null;

  const clear = isClear(details.licence_status);
  const label = clear ? "CSLB Verified" : "CSLB Issue";
  const verifiedDate = details.licence_verified_at
    ? new Date(details.licence_verified_at).toLocaleDateString()
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={
              "shrink-0 cursor-help text-[10px] font-semibold border " +
              (clear
                ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100")
            }
            onClick={(e) => e.stopPropagation()}
          >
            {clear ? (
              <ShieldCheck className="w-3 h-3 mr-1" />
            ) : (
              <ShieldAlert className="w-3 h-3 mr-1" />
            )}
            {variant === "full" ? `${label} · #${details.cslb_licence_number}` : label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">CSLB Licence #{details.cslb_licence_number}</p>
          <p className="text-muted-foreground text-xs">
            Status: {details.licence_status || "Unknown"}
          </p>
          {verifiedDate && (
            <p className="text-muted-foreground text-xs">Verified {verifiedDate}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
