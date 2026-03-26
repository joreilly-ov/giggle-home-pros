import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ListChecks,
  Plus,
  Trash2,
  Camera,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Milestone, MilestoneStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CFG: Record<MilestoneStatus, { label: string; classes: string }> = {
  pending: {
    label: "Not started",
    classes: "bg-secondary text-muted-foreground border-border",
  },
  submitted: {
    label: "Evidence submitted",
    classes:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  },
  approved: {
    label: "Approved",
    classes:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  },
  rejected: {
    label: "Rejected — resubmit required",
    classes:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MilestonesCardProps {
  jobId: string;
  role: "homeowner" | "contractor";
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MilestonesCard({ jobId, role }: MilestonesCardProps) {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.milestones.list(jobId);
      setMilestones(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading milestones…
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              Milestones
              {milestones.length > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {milestones.filter((m) => m.status === "approved").length}/{milestones.length}
                </Badge>
              )}
            </CardTitle>
            {role === "homeowner" && milestones.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-3 h-3" /> Add milestones
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {milestones.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              {role === "homeowner"
                ? "Break the job into milestones so you can track progress."
                : "The homeowner hasn't set milestones for this job yet."}
            </p>
          )}

          {milestones
            .sort((a, b) => a.order_index - b.order_index)
            .map((m, idx) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                index={idx}
                role={role}
                jobId={jobId}
                expanded={expandedId === m.id}
                onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
                onUpdated={load}
              />
            ))}
        </CardContent>
      </Card>

      {role === "homeowner" && (
        <CreateMilestonesModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          jobId={jobId}
          onCreated={load}
        />
      )}
    </>
  );
}

// ─── Milestone row ────────────────────────────────────────────────────────────

interface MilestoneRowProps {
  milestone: Milestone;
  index: number;
  role: "homeowner" | "contractor";
  jobId: string;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: () => void;
}

function MilestoneRow({
  milestone: m,
  index,
  role,
  jobId,
  expanded,
  onToggle,
  onUpdated,
}: MilestoneRowProps) {
  const { toast } = useToast();
  const cfg = STATUS_CFG[m.status];
  const [acting, setActing] = useState(false);

  const handleAction = async (action: "approve" | "reject") => {
    setActing(true);
    try {
      await api.milestones.review(jobId, m.id, action);
      toast({ title: action === "approve" ? "Milestone approved" : "Milestone rejected" });
      onUpdated();
    } catch (e) {
      toast({
        title: "Failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setActing(false);
    }
  };

  const canSubmitPhoto = role === "contractor" && (m.status === "pending" || m.status === "rejected");
  const canReview = role === "homeowner" && m.status === "submitted";

  return (
    <div className="bg-secondary/30 border border-border rounded-lg overflow-hidden">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors min-h-[48px]"
        onClick={onToggle}
      >
        <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
          {index + 1}
        </span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
          {m.description && !expanded && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{m.description}</p>
          )}
        </div>
        <Badge variant="outline" className={`text-[10px] font-semibold border shrink-0 ${cfg.classes}`}>
          {cfg.label}
        </Badge>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {m.description && (
            <p className="text-sm text-muted-foreground">{m.description}</p>
          )}

          {/* Photo grid */}
          {m.photos && m.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {m.photos.map((p) => (
                <div key={p.id} className="relative group">
                  <img
                    src={p.url}
                    alt="Evidence"
                    className="w-full aspect-square object-cover rounded-lg border border-border"
                  />
                  {p.note && (
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-1.5 rounded-b-lg">
                      <p className="text-[10px] text-foreground truncate">{p.note}</p>
                    </div>
                  )}
                  {p.ai_analysis && (
                    <div className="absolute top-1 right-1">
                      <Badge className="text-[9px] bg-primary/90 gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Homeowner review buttons */}
          {canReview && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                disabled={acting}
                onClick={() => handleAction("approve")}
              >
                {acting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                disabled={acting}
                onClick={() => handleAction("reject")}
              >
                <XCircle className="w-3 h-3" /> Reject
              </Button>
            </div>
          )}

          {/* Contractor photo upload */}
          {canSubmitPhoto && (
            <PhotoUploadSection jobId={jobId} milestoneId={m.id} onUploaded={onUpdated} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Contractor photo upload ──────────────────────────────────────────────────

function PhotoUploadSection({
  jobId,
  milestoneId,
  onUploaded,
}: {
  jobId: string;
  milestoneId: string;
  onUploaded: () => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [analyse, setAnalyse] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10 MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!preview) return;
    setUploading(true);
    setAiResult(null);
    try {
      const result = await api.milestones.submitPhoto(jobId, milestoneId, preview, note || undefined, analyse);
      if (result.ai_analysis?.likely_issue) {
        setAiResult(result.ai_analysis.likely_issue as string);
      }
      toast({ title: "Evidence submitted" });
      setPreview(null);
      setNote("");
      onUploaded();
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {preview ? (
        <div className="space-y-3">
          <img src={preview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border border-border" />
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)…"
            rows={2}
            className="resize-none text-sm"
            maxLength={500}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id={`ai-${milestoneId}`}
              checked={analyse}
              onCheckedChange={(v) => setAnalyse(v === true)}
            />
            <Label htmlFor={`ai-${milestoneId}`} className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Run AI verification
            </Label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5" disabled={uploading} onClick={handleSubmit}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              Submit Evidence
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPreview(null);
                setNote("");
              }}
            >
              Cancel
            </Button>
          </div>
          {aiResult && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3" /> AI Analysis
              </p>
              <p className="text-sm text-foreground">{aiResult}</p>
            </div>
          )}
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="w-3 h-3" /> Upload photo evidence
        </Button>
      )}
    </div>
  );
}

// ─── Create milestones modal ──────────────────────────────────────────────────

interface CreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onCreated: () => void;
}

interface DraftMilestone {
  title: string;
  description: string;
}

function CreateMilestonesModal({ open, onOpenChange, jobId, onCreated }: CreateModalProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<DraftMilestone[]>([{ title: "", description: "" }]);
  const [saving, setSaving] = useState(false);

  const updateRow = (idx: number, field: keyof DraftMilestone, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { title: "", description: "" }]);

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const valid = rows.filter((r) => r.title.trim());
    if (valid.length === 0) {
      toast({ title: "Add at least one milestone with a title", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.milestones.create(
        jobId,
        valid.map((r, i) => ({
          title: r.title.trim(),
          description: r.description.trim() || undefined,
          order_index: i,
        }))
      );
      toast({ title: "Milestones created" });
      onCreated();
      onOpenChange(false);
      setRows([{ title: "", description: "" }]);
    } catch (e) {
      toast({
        title: "Failed to save milestones",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Milestones</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-xs font-bold text-muted-foreground mt-3 w-5 text-center shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 space-y-1.5">
                <Input
                  value={row.title}
                  onChange={(e) => updateRow(idx, "title", e.target.value)}
                  placeholder="Milestone title *"
                  className="text-sm"
                  maxLength={200}
                />
                <Input
                  value={row.description}
                  onChange={(e) => updateRow(idx, "description", e.target.value)}
                  placeholder="Description (optional)"
                  className="text-sm"
                  maxLength={500}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 mt-1 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(idx)}
                disabled={rows.length <= 1}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary" onClick={addRow}>
            <Plus className="w-3 h-3" /> Add another
          </Button>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListChecks className="w-3.5 h-3.5" />}
            Save Milestones
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
