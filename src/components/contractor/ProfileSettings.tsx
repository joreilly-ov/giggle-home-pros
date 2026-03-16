import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Building2, MapPin, Phone, Loader2 } from "lucide-react";

interface ContractorData {
  id: string;
  business_name: string;
  postcode: string;
  phone: string;
  expertise: string[];
}

export function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ContractorData | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [zipLocation, setZipLocation] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [phone, setPhone] = useState("");

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
        .select("id, business_name, postcode, phone, expertise")
        .eq("user_id", user.id)
        .single();

      if (row) {
        const r = row as any;
        setData(r);
        setBusinessName(r.business_name);
        setPostcode(r.postcode);
        setPhone(r.phone);
        if (r.postcode && /^\d{5}$/.test(r.postcode)) {
          lookupZip(r.postcode);
        }
      }
      setLoading(false);
    })();
  }, [user, lookupZip]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    const { error } = await supabase
      .from("contractors" as any)
      .update({ business_name: businessName, postcode, phone } as any)
      .eq("id", data.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>;
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

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Business Information
          </CardTitle>
          <CardDescription>Update your core business details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bname">Business Name</Label>
            <Input id="bname" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pcode" className="flex items-center gap-1"><MapPin className="w-3 h-3" /> ZIP / Postcode</Label>
              <div className="relative mt-1.5">
                <Input id="pcode" value={postcode} onChange={(e) => handleZipChange(e.target.value)} inputMode="numeric" maxLength={5} />
                {zipLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {zipLocation && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span>{zipLocation}</span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="ph" className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
              <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Expertise</CardTitle>
          <CardDescription>Your selected trade categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.expertise.map((e) => (
              <Badge key={e} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {e}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}