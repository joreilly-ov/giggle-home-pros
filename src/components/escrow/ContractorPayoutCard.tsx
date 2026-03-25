import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Landmark, ExternalLink, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface ConnectStatus {
  connected: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  account_id: string;
}

export function ContractorPayoutCard() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await api.contractor.connectStatus();
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleOnboard = async () => {
    setRedirecting(true);
    try {
      const origin = window.location.origin;
      const res = await api.contractor.connectOnboard(
        `${origin}/contractor/connect/return`,
        `${origin}/contractor/connect/refresh`,
      );
      window.location.href = res.onboarding_url;
    } catch {
      setRedirecting(false);
    }
  };

  const isConnected = status?.connected && status.payouts_enabled;
  const isIncomplete = status?.connected && !status.payouts_enabled;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-heading">Bank Account for Payouts</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Link your bank account to receive payments from completed jobs.
            </CardDescription>
          </div>
          {isConnected && (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/25 gap-1">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </Badge>
          )}
          {isIncomplete && (
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/25 gap-1">
              <AlertTriangle className="w-3 h-3" /> Incomplete
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking account status…
          </div>
        ) : isConnected ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-foreground">
            <p className="font-medium">Your bank account is connected.</p>
            <p className="text-muted-foreground mt-1">
              Payouts will be sent automatically when homeowners release escrow funds.
            </p>
            {status?.account_id && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Account: {status.account_id}
              </p>
            )}
          </div>
        ) : isIncomplete ? (
          <>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-foreground">
              <p>
                Your account setup is incomplete. Please finish onboarding with Stripe to enable payouts.
              </p>
            </div>
            <Button onClick={handleOnboard} disabled={redirecting} className="gap-2">
              {redirecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {redirecting ? "Redirecting…" : "Complete account setup"}
            </Button>
          </>
        ) : (
          <>
            <div className="bg-secondary/60 border border-border rounded-xl p-4 text-sm text-muted-foreground">
              <p>
                Connect your bank account through Stripe to receive payouts when homeowners release
                escrow funds after job completion.
              </p>
            </div>
            <Button onClick={handleOnboard} disabled={redirecting} className="gap-2">
              {redirecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {redirecting ? "Redirecting…" : "Link bank account"}
            </Button>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Need help? Contact{" "}
          <a href="/contact" className="text-primary hover:underline">
            support
          </a>
          .
        </p>
      </CardContent>
    </Card>
  );
}
