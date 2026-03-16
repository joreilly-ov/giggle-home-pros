import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, MapPin, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const INTEREST_OPTIONS = [
  { label: "Plumbing", icon: "🔧" },
  { label: "Electrical", icon: "⚡" },
  { label: "Structural", icon: "🏗️" },
  { label: "Damp", icon: "💧" },
  { label: "Roofing", icon: "🏠" },
  { label: "General", icon: "🔨" },
  { label: "HVAC", icon: "❄️" },
  { label: "Painting", icon: "🎨" },
];

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [roadAddress, setRoadAddress] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [zipLooking, setZipLooking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, email, postcode, city, state, road_address, interests")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setEmail(data.email || user.email || "");
          setPostcode(data.postcode || "");
          setCity(data.city || "");
          setState(data.state || "");
          setRoadAddress(data.road_address || "");
          setInterests((data as any).interests || []);
        } else {
          setEmail(user.email || "");
        }
        setLoaded(true);
      });
  }, [user]);

  const lookupZip = useCallback(async (zip: string) => {
    if (!/^\d{5}$/.test(zip)) return;
    setZipLooking(true);
    try {
      const { data, error } = await supabase.functions.invoke("zip-lookup", {
        body: { zip },
      });
      if (!error && data?.city) {
        setCity(data.city);
        setState(data.state);
      }
    } catch {
      // silent fail — user can type manually
    } finally {
      setZipLooking(false);
    }
  }, []);

  const handlePostcodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 5);
    setPostcode(cleaned);
    if (cleaned.length === 5) lookupZip(cleaned);
  };

  const toggleInterest = (label: string) => {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const validateProfile = (): string | null => {
    if (fullName.trim().length > 0 && fullName.trim().length < 2) return "Full name must be at least 2 characters.";
    if (fullName.trim().length > 100) return "Full name must be under 100 characters.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
    if (postcode && !/^\d{5}$/.test(postcode)) return "Please enter a valid 5-digit ZIP code.";
    if (city.trim().length > 100) return "City name is too long.";
    if (state.trim().length > 50) return "State is too long.";
    if (roadAddress.trim().length > 200) return "Street address is too long.";
    return null;
  };

  const handleSave = async () => {
    if (!user) return;
    const err = validateProfile();
    if (err) { toast({ title: "Please check your details", description: err, variant: "destructive" }); return; }
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        email: email || null,
        postcode: postcode || null,
        city: city || null,
        state: state || null,
        road_address: roadAddress || null,
        interests,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved", description: "Your changes have been saved." });
      navigate("/dashboard");
    }
  };

  if (authLoading || !loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg">
      <Navbar variant="solid" />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-8">Your Profile</h1>

        {/* Name & Email */}
        <section className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-heading font-bold text-foreground mb-4">Personal Info</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-heading font-bold text-foreground mb-1 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Address
          </h2>
          <p className="text-sm text-muted-foreground mb-4">USA addresses only. Enter your ZIP to auto-fill city & state.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">ZIP Code</label>
                <div className="relative">
                  <Input
                    value={postcode}
                    onChange={(e) => handlePostcodeChange(e.target.value)}
                    placeholder="90210"
                    maxLength={5}
                    inputMode="numeric"
                  />
                  {zipLooking && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!zipLooking && city && postcode.length === 5 && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Los Angeles" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">State</label>
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="CA" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Street Address</label>
                <Input value={roadAddress} onChange={(e) => setRoadAddress(e.target.value)} placeholder="123 Main St" />
              </div>
            </div>
          </div>
        </section>

        {/* Interests */}
        <section className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-heading font-bold text-foreground mb-1">Interests</h2>
          <p className="text-sm text-muted-foreground mb-4">Select the repair categories you care about.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {INTEREST_OPTIONS.map((cat) => (
              <button
                key={cat.label}
                onClick={() => toggleInterest(cat.label)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  interests.includes(cat.label)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </main>
    </div>
  );
};

export default Profile;
