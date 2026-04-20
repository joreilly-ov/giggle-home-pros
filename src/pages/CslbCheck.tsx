import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, ShieldCheck, ShieldAlert, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Personnel {
  seq_no: string;
  name: string;
  name_type: string | null;
  titles: string[] | null;
  class_codes: string[] | null;
  surety_type: string | null;
  surety_company: string | null;
  bond_amount: number | null;
  bond_effective_date: string | null;
  association_dates: string[] | null;
  disassociation_dates: string[] | null;
}

interface LicenceResult {
  licence_number: string;
  business_name: string;
  full_business_name: string | null;
  business_type: string | null;
  classifications: string | null;
  primary_status: string;
  secondary_status: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  is_active: boolean;
  wc_coverage_type: string | null;
  wc_insurer: string | null;
  wc_policy_number: string | null;
  wc_expiration_date: string | null;
  wc_is_current: boolean;
  cb_surety: string | null;
  cb_number: string | null;
  cb_amount: number | null;
  cb_expiration_date: string | null;
  cb_cancellation_date: string | null;
  personnel: Personnel[];
}

interface BulkRow {
  licence_number: string;
  business_name: string;
  primary_status: string;
  is_active: boolean;
  expiration_date: string | null;
  wc_is_current: boolean;
  not_found: boolean;
}

const QUICK_FILL = [
  { number: "1000002", label: "1000002 — CLEAR, Sole Owner" },
  { number: "1000003", label: "1000003 — Work Comp Susp" },
];

const validateLicenceNumber = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return "Please enter a licence number";
  if (!/^\d+$/.test(trimmed)) return "CSLB licence numbers are numeric (e.g. 1000002)";
  return null;
};

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

const formatMoney = (amount: number | null) =>
  amount == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

const StatusBadge = ({ active, status }: { active: boolean; status: string }) => (
  <Badge
    className={
      active
        ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
        : "bg-red-100 text-red-800 border-red-300 hover:bg-red-100"
    }
  >
    {active ? <ShieldCheck className="w-3 h-3 mr-1" /> : <ShieldAlert className="w-3 h-3 mr-1" />}
    {status}
  </Badge>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-t pt-4 mt-4">
    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">{title}</h3>
    {children}
  </div>
);

const KV = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-[140px_1fr] gap-2 text-sm py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value ?? "—"}</span>
  </div>
);

export default function CslbCheck() {
  // Single lookup state
  const [licenceInput, setLicenceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LicenceResult | null>(null);
  const [searchedNumber, setSearchedNumber] = useState<string | null>(null);

  // Bulk state
  const [bulkInput, setBulkInput] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkRow[]>([]);

  const runLookup = async (number: string) => {
    const validationError = validateLicenceNumber(number);
    if (validationError) {
      setError(validationError);
      setResult(null);
      setSearchedNumber(null);
      return;
    }
    const trimmed = number.trim();
    setLoading(true);
    setError(null);
    setResult(null);
    setSearchedNumber(trimmed);

    try {
      const { data, error: rpcError } = await supabase.rpc("lookup_cslb_licence", { p_licence_number: trimmed });
      if (rpcError) {
        setError(rpcError.message);
      } else if (!data) {
        setError(`No licence found for ${trimmed}`);
      } else {
        setResult(data as unknown as LicenceResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const runBulk = async () => {
    const numbers = bulkInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (numbers.length === 0) return;

    setBulkLoading(true);
    setBulkResults([]);

    const results: BulkRow[] = [];
    for (const num of numbers) {
      if (!/^\d+$/.test(num)) {
        results.push({
          licence_number: num,
          business_name: "Invalid format",
          primary_status: "—",
          is_active: false,
          expiration_date: null,
          wc_is_current: false,
          not_found: true,
        });
        continue;
      }
      const { data } = await supabase.rpc("lookup_cslb_licence", { p_licence_number: num });
      if (!data) {
        results.push({
          licence_number: num,
          business_name: "Not found",
          primary_status: "—",
          is_active: false,
          expiration_date: null,
          wc_is_current: false,
          not_found: true,
        });
      } else {
        const d = data as unknown as LicenceResult;
        results.push({
          licence_number: d.licence_number,
          business_name: d.business_name,
          primary_status: d.primary_status,
          is_active: d.is_active,
          expiration_date: d.expiration_date,
          wc_is_current: d.wc_is_current,
          not_found: false,
        });
      }
    }
    setBulkResults(results);
    setBulkLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>CSLB Licence Check | KisX</title>
        <meta name="description" content="Look up California State License Board (CSLB) contractor licences, workers' comp, and bond status." />
      </Helmet>
      <Navbar variant="solid" />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">CSLB Licence Check</h1>
            <p className="text-muted-foreground">
              Verify California contractor licences, workers' comp coverage, and bond status directly from CSLB data.
            </p>
          </div>

          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="single">Single Lookup</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Search</TabsTrigger>
            </TabsList>

            {/* SINGLE LOOKUP */}
            <TabsContent value="single" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Licence Lookup</CardTitle>
                  <CardDescription>Enter a CSLB licence number to verify status and credentials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. 1000002"
                      value={licenceInput}
                      onChange={(e) => setLicenceInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && runLookup(licenceInput)}
                      disabled={loading}
                    />
                    <Button onClick={() => runLookup(licenceInput)} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center mr-1">Quick fill:</span>
                    {QUICK_FILL.map((q) => (
                      <Button
                        key={q.number}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLicenceInput(q.number);
                          runLookup(q.number);
                        }}
                        disabled={loading}
                      >
                        {q.label}
                      </Button>
                    ))}
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>

              {result && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle className="text-xl">{result.business_name}</CardTitle>
                        <CardDescription className="mt-1">
                          Licence #{result.licence_number}
                          {result.business_type && <> · {result.business_type}</>}
                        </CardDescription>
                      </div>
                      <StatusBadge active={result.is_active} status={result.primary_status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <KV label="Expiration" value={formatDate(result.expiration_date)} />
                    <KV label="Issued" value={formatDate(result.issue_date)} />
                    <KV label="Classifications" value={result.classifications || "—"} />
                    {result.secondary_status && <KV label="Secondary" value={result.secondary_status} />}

                    <Section title="Workers' Comp">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={
                            result.wc_is_current
                              ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                              : "bg-red-100 text-red-800 border-red-300 hover:bg-red-100"
                          }
                        >
                          {result.wc_is_current ? "Current" : "Not Current"}
                        </Badge>
                        {result.wc_coverage_type && (
                          <span className="text-sm text-muted-foreground">{result.wc_coverage_type}</span>
                        )}
                      </div>
                      <KV label="Insurer" value={result.wc_insurer} />
                      <KV label="Policy #" value={result.wc_policy_number} />
                      <KV label="Expires" value={formatDate(result.wc_expiration_date)} />
                    </Section>

                    <Section title="Contractor Bond">
                      <KV label="Surety" value={result.cb_surety} />
                      <KV label="Bond #" value={result.cb_number} />
                      <KV label="Amount" value={formatMoney(result.cb_amount)} />
                      <KV label="Effective" value={formatDate(result.cb_expiration_date)} />
                      <KV label="Cancelled" value={formatDate(result.cb_cancellation_date)} />
                    </Section>

                    <Section title={`Personnel (${result.personnel?.length || 0})`}>
                      {result.personnel && result.personnel.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Titles</TableHead>
                                <TableHead>Class Codes</TableHead>
                                <TableHead>Associated</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.personnel.map((p) => (
                                <TableRow key={p.seq_no}>
                                  <TableCell className="font-medium">{p.name}</TableCell>
                                  <TableCell className="text-xs">{p.titles?.join(", ") || "—"}</TableCell>
                                  <TableCell className="text-xs">{p.class_codes?.join(", ") || "—"}</TableCell>
                                  <TableCell className="text-xs">
                                    {p.association_dates?.length
                                      ? p.association_dates.map((d) => formatDate(d)).join(", ")
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No personnel records.</p>
                      )}
                    </Section>
                  </CardContent>
                </Card>
              )}

              {!result && !error && !loading && searchedNumber === null && (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>Enter a licence number above to begin.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* BULK SEARCH */}
            <TabsContent value="bulk" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bulk Search</CardTitle>
                  <CardDescription>
                    Paste multiple licence numbers (one per line) to verify them all at once.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={"1000002\n1000003\n1000004"}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    rows={6}
                    disabled={bulkLoading}
                  />
                  <Button onClick={runBulk} disabled={bulkLoading || !bulkInput.trim()}>
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Run Bulk Lookup
                  </Button>
                </CardContent>
              </Card>

              {bulkResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Results ({bulkResults.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Licence</TableHead>
                            <TableHead>Business</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead>WC</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkResults.map((r, i) => (
                            <TableRow key={`${r.licence_number}-${i}`}>
                              <TableCell className="font-mono text-xs">{r.licence_number}</TableCell>
                              <TableCell className={r.not_found ? "text-muted-foreground italic" : "font-medium"}>
                                {r.business_name}
                              </TableCell>
                              <TableCell>
                                {r.not_found ? (
                                  <Badge variant="outline" className="text-xs">—</Badge>
                                ) : (
                                  <StatusBadge active={r.is_active} status={r.primary_status} />
                                )}
                              </TableCell>
                              <TableCell className="text-xs">{formatDate(r.expiration_date)}</TableCell>
                              <TableCell>
                                {r.not_found ? (
                                  "—"
                                ) : (
                                  <Badge
                                    className={
                                      r.wc_is_current
                                        ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100 text-xs"
                                        : "bg-red-100 text-red-800 border-red-300 hover:bg-red-100 text-xs"
                                    }
                                  >
                                    {r.wc_is_current ? "Current" : "Not"}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
