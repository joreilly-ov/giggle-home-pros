import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, PoundSterling } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Inner checkout form ──────────────────────────────────────────────────────

function CheckoutForm({ amountPence }: { amountPence: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast({
        title: "Payment failed",
        description: error.message ?? "Something went wrong",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-secondary/60 border border-border rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <PoundSterling className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Escrow Amount
          </p>
          <p className="text-2xl font-bold font-heading text-foreground">
            £{(amountPence / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <PaymentElement />

      <Button type="submit" className="w-full gap-2" disabled={!stripe || submitting}>
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ShieldCheck className="w-4 h-4" />
        )}
        {submitting ? "Processing…" : "Pay & hold in escrow"}
      </Button>
    </form>
  );
}

// ─── Main wrapper ─────────────────────────────────────────────────────────────

interface EscrowPaymentProps {
  jobId: string;
}

export function EscrowPayment({ jobId }: EscrowPaymentProps) {
  const { toast } = useToast();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountPence, setAmountPence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Stripe publishable key on mount
  useEffect(() => {
    setLoading(true);
    api.escrow
      .config()
      .then(({ stripe_publishable_key }) => {
        setStripePromise(loadStripe(stripe_publishable_key));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load payment config"))
      .finally(() => setLoading(false));
  }, []);

  const handleInitiate = async () => {
    setInitiating(true);
    setError(null);
    try {
      const res = await api.escrow.initiate(jobId);
      setClientSecret(res.client_secret);
      setAmountPence(res.amount_pence);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to initiate payment";
      setError(msg);
      toast({ title: "Payment error", description: msg, variant: "destructive" });
    } finally {
      setInitiating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading payment…
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-5 text-center text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  // Step 1: show "Pay & hold in escrow" trigger
  if (!clientSecret) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-heading">Secure Payment</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Funds are held in escrow until you approve the completed work.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handleInitiate} disabled={initiating} className="gap-2 w-full">
            {initiating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {initiating ? "Setting up…" : "Pay & hold in escrow"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Step 2: show Stripe payment form
  if (!stripePromise) return null;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Complete Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm amountPence={amountPence} />
        </Elements>
      </CardContent>
    </Card>
  );
}
