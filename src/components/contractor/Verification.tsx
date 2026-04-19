import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ContractorDocuments } from "@/components/contractor/ContractorDocuments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, Save, CheckCircle2, AlertCircle } from "lucide-react";

export function Verification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractorId, setContractorId] = useState<string | null>(null);

  const [licenseNumber, setLicenseNumber] = useState("");
  const [insuranceDetails, setInsuranceDetails] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: row } = await supabase
        .from("contractors" as any)
        .select("id, license_number, insurance_details")
        .eq("user_id", user.id)
        .single();

      if (row) {
        const r = row as any;
        setContractorId(r.id);
        setLicenseNumber(r.license_number ?? "");
        setInsuranceDetails(r.insurance_details ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!contractorId) return;
    setSaving(true);
    const { error } = await supabase
      .from("contractors" as any)
      .update({ license_number: licenseNumber || null, insurance_details: insuranceDetails || null } as any)
      .eq("id", contractorId);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification details saved" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>;
  }

  if (!contractorId) {
    return (
      <Card className="border-border">
        <CardContent className="p-8 text-center text-muted-foreground">
          No contractor profile found.{" "}
          <a href="/contractor/signup" className="text-primary hover:underline">Sign up first</a>.
        </CardContent>
      </Card>
    );
  }

  const hasLicense = licenseNumber.trim() !== "";
  const hasInsurance = insuranceDetails.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Status overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-5 flex items-center gap-4">
            {hasLicense ? (
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">License</p>
              <p className="text-xs text-muted-foreground">{hasLicense ? "Provided" : "Not provided"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5 flex items-center gap-4">
            {hasInsurance ? (
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">Insurance</p>
              <p className="text-xs text-muted-foreground">{hasInsurance ? "Provided" : "Not provided"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Verification Details
          </CardTitle>
          <CardDescription>
            Adding your license and insurance helps you win more bids and builds trust with homeowners.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="license">License Number</Label>
            <Input
              id="license"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. CA-LIC-123456"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="insurance">Insurance Details</Label>
            <Input
              id="insurance"
              value={insuranceDetails}
              onChange={(e) => setInsuranceDetails(e.target.value)}
              placeholder="e.g. Policy #INS-789012, Acme Insurance Co."
              className="mt-1.5"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Verification"}
          </Button>
        </CardContent>
      </Card>

      <ContractorDocuments />
    </div>
  );
}
