import { useState, useEffect, useRef } from "react";
import { api, type ContractorDocument, type DocumentType } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  XCircle,
  Calendar,
  ShieldCheck,
} from "lucide-react";

const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  insurance: "Insurance Certificate",
  licence: "Trade Licence",
  certification: "Certification / Qualification",
  other: "Other",
};

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatExpiry(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function isExpired(doc: ContractorDocument): boolean {
  if (doc.status === "expired") return true;
  if (!doc.expires_at) return false;
  return new Date(doc.expires_at).getTime() < Date.now();
}

export function ContractorDocuments() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<ContractorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<DocumentType>("insurance");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const list = await api.documents.listMine();
      setDocs(list);
    } catch (e) {
      toast({
        title: "Couldn't load documents",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png)$/i.test(file.type)) {
      toast({
        title: "Unsupported file",
        description: "Please upload a JPEG or PNG scan.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast({
        title: "File too large",
        description: "Maximum size is 20 MB.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const dataUri = await fileToDataUri(file);
      const result = await api.documents.upload({
        document_type: docType,
        file_name: file.name,
        file_source: dataUri,
      });

      const fields = result.extracted_data
        ? Object.entries(result.extracted_data)
            .filter(([, v]) => v != null && v !== "")
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")
        : null;

      toast({
        title:
          result.status === "verified"
            ? "Document verified ✓"
            : "Uploaded — manual review in progress",
        description: fields || `${DOCUMENT_TYPE_LABEL[result.document_type]} received.`,
      });
      await refresh();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.documents.remove(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Document deleted" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> My Documents
        </CardTitle>
        <CardDescription>
          Upload scans of your insurance, licences and certifications. Verified documents appear as
          trust badges on your public profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload form */}
        <div className="space-y-3 rounded-lg border border-dashed border-border p-4 bg-muted/30">
          <div>
            <Label htmlFor="doctype" className="text-sm font-medium">
              Document type
            </Label>
            <Select
              value={docType}
              onValueChange={(v) => setDocType(v as DocumentType)}
              disabled={uploading}
            >
              <SelectTrigger id="doctype" className="mt-1.5 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DOCUMENT_TYPE_LABEL) as DocumentType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {DOCUMENT_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="gap-2 w-full sm:w-auto"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Analysing scan…" : "Upload scan (JPEG / PNG, max 20 MB)"}
          </Button>
        </div>

        {/* Documents list */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading documents…
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {docs.map((d) => {
              const expired = isExpired(d);
              const expiry = formatExpiry(d.expires_at);
              return (
                <li
                  key={d.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {DOCUMENT_TYPE_LABEL[d.document_type]}
                      </p>
                      {expired ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1 border-destructive/40 text-destructive bg-destructive/10"
                        >
                          <XCircle className="w-3 h-3" /> Expired
                        </Badge>
                      ) : d.status === "verified" ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1 border-primary/40 text-primary bg-primary/10"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1 border-accent/50 text-accent-foreground bg-accent/15"
                        >
                          <AlertTriangle className="w-3 h-3" /> Needs Review
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{d.file_name}</p>
                    {d.status === "needs_review" && !expired && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Manual review in progress — we'll email you when it's done.
                      </p>
                    )}
                    {expiry && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {expired ? "Expired" : "Expires"} {expiry}
                      </p>
                    )}
                    {d.extracted_data && Object.keys(d.extracted_data).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-primary cursor-pointer hover:underline">
                          View extracted details
                        </summary>
                        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
                          {Object.entries(d.extracted_data).map(([k, v]) =>
                            v == null || v === "" ? null : (
                              <div key={k} className="contents">
                                <dt className="text-muted-foreground capitalize">
                                  {k.replace(/_/g, " ")}
                                </dt>
                                <dd className="text-foreground break-words">{String(v)}</dd>
                              </div>
                            ),
                          )}
                        </dl>
                      </details>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(d.id)}
                    disabled={deletingId === d.id}
                    aria-label="Delete document"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    {deletingId === d.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
