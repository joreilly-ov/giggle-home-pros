import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare } from "lucide-react";

interface Props {
  questions: string[];
  onSubmit: (answers: Record<string, string>) => Promise<void>;
}

export function ClarificationsStep({ questions, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">A few quick questions</h2>
          <p className="text-sm text-muted-foreground">Help us create a more accurate project brief for contractors</p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.slice(0, 5).map((q, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <span>{q}</span>
            </Label>
            <Input
              value={answers[q] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
              placeholder="Your answer…"
              className="ml-8"
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full gap-2"
        size="lg"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating project brief…</>
        ) : (
          "Generate RFP"
        )}
      </Button>
    </div>
  );
}
