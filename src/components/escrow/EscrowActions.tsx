import { useState } from "react";
import { api, EscrowStatusValue } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EscrowActionsProps {
  jobId: string;
  escrowStatus: EscrowStatusValue;
  onStatusChanged: () => void;
}

export function EscrowActions({ jobId, escrowStatus, onStatusChanged }: EscrowActionsProps) {
  const { toast } = useToast();
  const [releaseNote, setReleaseNote] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [refunding, setRefunding] = useState(false);

  if (escrowStatus !== "held") return null;

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const res = await api.escrow.release(jobId, releaseNote);
      if (res.payout_pending) {
        toast({
          title: "Payment approved",
          description: "Contractor payout pending account setup.",
        });
      } else {
        toast({ title: "Payment released to contractor." });
      }
      onStatusChanged();
    } catch (e) {
      toast({
        title: "Failed to release payment",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setReleasing(false);
    }
  };

  const handleRefund = async () => {
    setRefunding(true);
    try {
      await api.escrow.refund(jobId, refundReason);
      toast({ title: "Refund initiated." });
      onStatusChanged();
    } catch (e) {
      toast({
        title: "Refund failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Release */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Approve work &amp; release payment
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will release the escrowed funds to the contractor. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Optional notes for approval…"
            value={releaseNote}
            onChange={(e) => setReleaseNote(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRelease} disabled={releasing}>
              {releasing && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Release payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            <RotateCcw className="w-4 h-4" />
            Request refund
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request a refund?</AlertDialogTitle>
            <AlertDialogDescription>
              The escrowed funds will be returned to your original payment method. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for refund (optional)…"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={refunding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {refunding && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Confirm refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
