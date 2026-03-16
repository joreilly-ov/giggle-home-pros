import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Building2,
  MapPin,
  Phone,
  Loader2,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award,
} from "lucide-react";

interface ContractorData {
  id: string;
  business_name: string;
  postcode: string;
  phone: string;
  expertise: string[];
  license_number: string | null;
  insurance_details: string | null;
}

export function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);
  const [data, setData] = useState<ContractorData | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [zipLocation, setZipLocation] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [insuranceDetails, setInsuranceDetails] = useState("");

  const lookupZip = useCallback(async (code: string) => {
    if (!/^\d{5}$/.test(code)) return;
    setZipLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("zip-lookup", { body: { zip: code } });
      if (!error && data?.city) {
        setZipLocation(`${data.city}, ${data.state}`);
      } else {
        setZipLocation("");
      }
    } catch {
      setZipLocation("");
    } finally {
      setZipLoading(false);
    }
  }, []);

  const handleZipChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 5);
    setPostcode(cleaned);
    setZipLocation("");
    if (cleaned.length === 5) lookupZip(cleaned);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: row } = await supabase
        .from("contractors" as any)
        .select("id, business_name, postcode, phone, expertise, license_number, insurance_details")
        .eq("user_id", user.id)
        .single();

      if (row) {
        const r = row as any;
        setData(r);
        setBusinessName(r.business_name ?? "");
        setPostcode(r.postcode ?? "");
        setPhone(r.phone ?? "");
        setLicenseNumber(r.license_number ?? "");
        setInsuranceDetails(r.insurance_details ?? "");
        if (r.postcode && /^\d{5}$/.test(r.postcode)) {
          lookupZip(r.postcode);
        }
      }
      setLoading(false);
    })();
  }, [user, lookupZip]);

  const validateProfile = (): string | null => {
    const name = businessName.trim();
    if (name.length < 2) return "Business name must be at least 2 characters.";
    if (name.length > 100) return "Business name must be under 100 characters.";
    if (postcode && !/^\d{5}$/.test(postcode)) return "Please enter a valid 5-digit ZIP code.";
    const ph = phone.trim().replace(/[\s\-().+]/g, "");
    if (phone.trim() && !/^\d{7,15}$/.test(ph)) return "Please enter a valid phone number.";
    return null;
  };

  const validateVerification = (): string | null => {
    if (licenseNumber.trim().length > 50) return "License number must be under 50 characters.";
    if (insuranceDetails.trim().length > 200) return "Insurance details must be under 200 characters.";
    return null;
  };

  const handleSaveProfile = async () => {
    if (!data) return;
    const err = validateProfile();
    if (err) { toast({ title: "Please check your details", description: err, variant: "destructive" }); return; }
    setSavingProfile(true);
    const { error } = await supabase
      .from("contractors" as any)
      .update({ business_name: businessName, postcode, phone } as any)
      .eq("id", data.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved", description: "Your business details have been updated." });
      navigate("/contractor/profile");
    }
  };

  const handleSaveVerification = async () => {
    if (!data) return;
    const err = validateVerification();
    if (err) { toast({ title: "Please check your details", description: err, variant: "destructive" }); return; }
    setSavingVerification(true);
    const { error } = await supabase
      .from("contractors" as any)
      .update({ license_number: licenseNumber || null, insurance_details: insuranceDetails || null } as any)
      .eq("id", data.id);
    setSavingVerification(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification saved", description: "Your credentials have been updated." });
      navigate("/contractor/profile");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading profile…
      </div>
    );
  }

  if (!data) {
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
  const verifiedCount = [hasLicense, hasInsurance].filter(Boolean).length;

  return (
    <div className="space-y-8">

      {/* ── Business Information ── */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-heading">Business Information</CardTitle>
              <CardDescription className="text-xs mt-0.5">Your core business details shown to homeowners.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="bname" className="text-sm font-medium">Business Name</Label>
            <Input
              id="bname"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1.5 bg-background"
              placeholder="e.g. Smith Plumbing LLC"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pcode" className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-muted-foreground" /> ZIP / Postcode
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="pcode"
                  value={postcode}
                  onChange={(e) => handleZipChange(e.target.value)}
                  inputMode="numeric"
                  maxLength={5}
                  className="bg-background"
                />
                {zipLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {zipLocation && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 text-primary" /> {zipLocation}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="ph" className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-muted-foreground" /> Phone
              </Label>
              <Input
                id="ph"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 bg-background"
                placeholder="(555) 000-0000"
              />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Award className="w-3 h-3 text-muted-foreground" /> Expertise
            </Label>
            <div className="flex flex-wrap gap-2">
              {data.expertise.map((e) => (
                <Badge key={e} variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-xs">
                  {e}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingProfile ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Verification ── */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base font-heading">Verification</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Verified contractors win more bids and rank higher in search.
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                verifiedCount === 2
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              }`}>
                {verifiedCount}/2 verified
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Status pills */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "License", ok: hasLicense },
              { label: "Insurance", ok: hasInsurance },
            ].map(({ label, ok }) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  ok ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                     : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                }`}
              >
                {ok ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{ok ? "Provided" : "Not provided"}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div>
            <Label htmlFor="license" className="text-sm font-medium flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-muted-foreground" /> License Number
            </Label>
            <Input
              id="license"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. CA-LIC-123456"
              className="mt-1.5 bg-background"
            />
          </div>

          <div>
            <Label htmlFor="insurance" className="text-sm font-medium flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-muted-foreground" /> Insurance Details
            </Label>
            <Input
              id="insurance"
              value={insuranceDetails}
              onChange={(e) => setInsuranceDetails(e.target.value)}
              placeholder="e.g. Policy #INS-789012, Acme Insurance Co."
              className="mt-1.5 bg-background"
            />
          </div>

          <div className="pt-1">
            <Button onClick={handleSaveVerification} disabled={savingVerification} variant="outline" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20">
              {savingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {savingVerification ? "Saving…" : "Save Verification"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
