import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, ExternalLink } from "lucide-react";

export function ContractorPayoutCard() {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-heading">Bank Account for Payouts</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Link your bank account to receive payments from completed jobs.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-secondary/60 border border-border rounded-xl p-4 text-sm text-muted-foreground">
          <p>
            Stripe Connect onboarding is coming soon. Once available, you'll be able to link your
            bank account directly and receive payouts automatically when homeowners release escrow funds.
          </p>
        </div>
        <Button variant="outline" className="gap-2" disabled>
          <ExternalLink className="w-4 h-4" />
          Link bank account (coming soon)
        </Button>
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
