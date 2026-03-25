import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ConnectRefresh() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const origin = window.location.origin;
        const res = await api.contractor.connectOnboard(
          `${origin}/contractor/connect/return`,
          `${origin}/contractor/connect/refresh`,
        );
        window.location.href = res.onboarding_url;
      } catch {
        setError(true);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar variant="solid" />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            {error ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Could not generate a new onboarding link. Please try again from your profile.
                </p>
                <Button onClick={() => navigate("/contractor/profile/settings")}>
                  Back to Profile
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Generating a fresh onboarding link…
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
