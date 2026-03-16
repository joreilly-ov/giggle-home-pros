import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Wrench,
  Zap,
  Droplets,
  Home,
  Paintbrush,
  Hammer,
  Thermometer,
  HardHat,
  MapPin,
  Loader2,
} from "lucide-react";

const EXPERTISE_OPTIONS = [
  { label: "Plumbing", icon: Droplets, description: "Pipes, fixtures & water systems" },
  { label: "Electrical", icon: Zap, description: "Wiring, panels & lighting" },
  { label: "Structural", icon: HardHat, description: "Foundations, framing & load-bearing" },
  { label: "Damp & Waterproofing", icon: Droplets, description: "Moisture control & sealing" },
  { label: "Roofing", icon: Home, description: "Shingles, flashing & gutters" },
  { label: "General Contracting", icon: Hammer, description: "Full-service builds & renovations" },
  { label: "HVAC", icon: Thermometer, description: "Heating, cooling & ventilation" },
  { label: "Painting & Finishing", icon: Paintbrush, description: "Interior & exterior finishes" },
];

const ContractorOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [zipLocation, setZipLocation] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [phone, setPhone] = useState("");

  const [expertise, setExpertise] = useState<string[]>([]);

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

  const toggleExpertise = (label: string) => {
    setExpertise((prev) =>
      prev.includes(label) ? prev.filter((e) => e !== label) : [...prev, label]
    );
  };

  const isStep1Valid = businessName.trim() !== "" && postcode.trim() !== "" && phone.trim() !== "";

  const handleSubmit = async () => {
    if (expertise.length === 0) {
      toast({ title: "Select at least one expertise", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("contractors" as any).insert({
      user_id: user?.id ?? null,
      business_name: businessName.trim(),
      postcode: postcode.trim(),
      phone: phone.trim(),
      expertise,
    } as any);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Welcome aboard! 🎉", description: "Your contractor profile has been created." });
    navigate(user ? "/dashboard" : "/");
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-extrabold font-heading text-foreground tracking-tight">
            Stable<span className="text-primary">Gig</span>
          </a>
          <div className="flex items-center gap-2 justify-center mt-3">
            <Wrench className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">
              Contractor Sign Up
            </span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
            <span className={step >= 1 ? "text-primary" : ""}>1 · Business Info</span>
            <span className={step >= 2 ? "text-primary" : ""}>2 · Your Expertise</span>
          </div>
          <Progress value={step === 1 ? 50 : 100} className="h-1.5" />
        </div>

        <Card className="border-border shadow-lg">
          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">
                    Let's get you set up
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tell us a bit about your business.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Smith & Sons Plumbing"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postcode">ZIP / Postcode</Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="postcode"
                          value={postcode}
                          onChange={(e) => handleZipChange(e.target.value)}
                          placeholder="90210"
                          inputMode="numeric"
                          maxLength={5}
                        />
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
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">
                    Select your expertise
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose all the trades you cover. You can update these later.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {EXPERTISE_OPTIONS.map((opt) => {
                    const selected = expertise.includes(opt.label);
                    return (
                      <button
                        key={opt.label}
                        onClick={() => toggleExpertise(opt.label)}
                        className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <opt.icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                        <span className="text-xs text-muted-foreground leading-tight">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={saving || expertise.length === 0}
                  >
                    {saving ? "Creating Profile..." : "Complete Sign Up"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{" "}
          <a href="/auth" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContractorOnboarding;