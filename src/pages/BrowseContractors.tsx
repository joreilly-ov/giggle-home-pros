import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ReviewMediator } from "@/components/ReviewMediator";
import { api, type ContractorDocument } from "@/lib/api";
import { VerifiedDocsBadge } from "@/components/contractor/VerifiedDocsBadge";
import {
  Building2,
  MapPin,
  Star,
  Search,
  Loader2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

const DOC_TYPE_PUBLIC_LABEL: Record<string, string> = {
  insurance: "Public Liability Insurance",
  licence: "Trade Licence",
  certification: "Certification",
  other: "Document",
};

function formatExpiryShort(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function PublicVerifiedDocs({ contractorId }: { contractorId: string }) {
  const [docs, setDocs] = useState<ContractorDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.documents
      .listPublic(contractorId)
      .then((list) => {
        if (!cancelled) setDocs(list);
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contractorId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading credentials…
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
        No verified credentials on file yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Verified credentials
      </h3>
      <ul className="space-y-2">
        {docs.map((d) => {
          const label = DOC_TYPE_PUBLIC_LABEL[d.document_type] ?? "Document";
          const expiry = formatExpiryShort(d.expires_at);
          return (
            <li
              key={d.id}
              className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
            >
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label} verified</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {expiry ? `expires ${expiry}` : "no expiry"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface ContractorRow {
  id: string;
  user_id: string | null;
  business_name: string;
  postcode: string;
  phone: string;
  expertise: string[];
  license_number: string | null;
  insurance_details: string | null;
}

interface ContractorWithRating extends ContractorRow {
  avg_rating: number | null;
  review_count: number;
}

const BrowseContractors = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contractors, setContractors] = useState<ContractorWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{
    contractorId: string;
    businessName: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchContractors = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from("contractors")
        .select("id, user_id, business_name, postcode, phone, expertise, license_number, insurance_details")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const rows = (data as ContractorRow[]) ?? [];

      // Fetch review averages for each contractor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data: reviews } = await db
        .from("visible_reviews")
        .select("contractor_id, overall")
        .in("contractor_id", rows.map((r) => r.id));

      const reviewMap = new Map<string, { total: number; count: number }>();
      if (reviews) {
        for (const r of reviews) {
          const existing = reviewMap.get(r.contractor_id) ?? { total: 0, count: 0 };
          existing.total += r.overall;
          existing.count += 1;
          reviewMap.set(r.contractor_id, existing);
        }
      }

      const enriched: ContractorWithRating[] = rows.map((c) => {
        const stats = reviewMap.get(c.id);
        return {
          ...c,
          avg_rating: stats ? stats.total / stats.count : null,
          review_count: stats?.count ?? 0,
        };
      });

      setContractors(enriched);
      setLoading(false);
    };

    fetchContractors();
  }, [user]);

  const filtered = contractors.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.business_name.toLowerCase().includes(term) ||
      c.expertise.some((e) => e.toLowerCase().includes(term)) ||
      c.postcode.includes(term)
    );
  });

  const isVerified = (c: ContractorRow) =>
    !!(c.license_number?.trim() || c.insurance_details?.trim());

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col page-bg">
        <Navbar variant="solid" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">Please sign in to browse contractors.</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar variant="solid" />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold font-heading text-foreground mb-2">
            Browse Contractors
          </h1>
          <p className="text-muted-foreground">
            Find verified tradespeople in your area. View ratings and reviews from real homeowners.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, trade, or postcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading contractors…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-destructive font-medium">Failed to load contractors</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Building2 className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">
              {searchTerm ? "No contractors match your search" : "No contractors registered yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? "Try a different search term." : "Check back soon as more tradespeople join."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((c) => (
              <Card
                key={c.id}
                className="border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setReviewTarget({ contractorId: c.id, businessName: c.business_name })}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {c.business_name}
                        </h3>
                        {isVerified(c) && (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 shrink-0">
                            Verified
                          </Badge>
                        )}
                        <VerifiedDocsBadge contractorId={c.id} />
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-2">
                        {c.avg_rating != null ? (
                          <>
                            <span className="inline-flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i <= Math.round(c.avg_rating!)
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-muted-foreground/20 fill-none"
                                  }`}
                                />
                              ))}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {c.avg_rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({c.review_count} review{c.review_count !== 1 ? "s" : ""})
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">No reviews yet</span>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" /> {c.postcode}
                      </div>

                      {/* Expertise tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {c.expertise.slice(0, 4).map((e) => (
                          <Badge
                            key={e}
                            variant="secondary"
                            className="text-[10px] bg-secondary text-muted-foreground"
                          >
                            {e}
                          </Badge>
                        ))}
                        {c.expertise.length > 4 && (
                          <Badge variant="secondary" className="text-[10px] bg-secondary text-muted-foreground">
                            +{c.expertise.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Reviews sheet */}
      <Sheet open={!!reviewTarget} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading">
              {reviewTarget?.businessName}
            </SheetTitle>
          </SheetHeader>
          {reviewTarget && (
            <div className="space-y-6">
              <PublicVerifiedDocs contractorId={reviewTarget.contractorId} />
              <ReviewMediator
                contractorId={reviewTarget.contractorId}
                mode="list"
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BrowseContractors;
