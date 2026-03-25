import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function ConnectReturn() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "incomplete">("loading");

  useEffect(() => {
    (async () => {
      try {
        const s = await api.contractor.connectStatus();
        setStatus(s.payouts_enabled ? "success" : "incomplete");
      } catch {
        setStatus("incomplete");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar variant="solid" />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Verifying your account…</p>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h2 className="text-lg font-heading font-bold">Bank Account Connected</h2>
                <p className="text-sm text-muted-foreground">
                  You're all set to receive payouts when homeowners release escrow funds.
                </p>
                <Button onClick={() => navigate("/contractor/profile/settings")} className="mt-2">
                  Back to Profile
                </Button>
              </>
            )}
            {status === "incomplete" && (
              <>
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                <h2 className="text-lg font-heading font-bold">Setup Incomplete</h2>
                <p className="text-sm text-muted-foreground">
                  Your account onboarding isn't complete yet. Please return to your profile settings to
                  try again.
                </p>
                <Button onClick={() => navigate("/contractor/profile/settings")} className="mt-2">
                  Back to Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
