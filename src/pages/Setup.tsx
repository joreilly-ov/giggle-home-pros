import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const TRADE_CATEGORIES = [
  { label: "Plumbing", icon: "🔧" },
  { label: "Electrical", icon: "⚡" },
  { label: "Structural", icon: "🏗️" },
  { label: "Damp", icon: "💧" },
  { label: "Roofing", icon: "🏠" },
  { label: "General", icon: "🔨" },
  { label: "HVAC", icon: "❄️" },
  { label: "Painting", icon: "🎨" },
];

const Setup = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [roadAddress, setRoadAddress] = useState("");

  // Interests
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    // Check if setup already complete
    supabase
      .from("user_metadata")
      .select("setup_complete")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.setup_complete) navigate("/dashboard", { replace: true });
      });
  }, [user, navigate]);

  const toggleInterest = (label: string) => {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    const profileUpdate = supabase
      .from("profiles")
      .update({ full_name: fullName || null, postcode: postcode || null, city: city || null, state: state || null, road_address: roadAddress || null })
      .eq("id", user.id);

    const metadataUpdate = supabase
      .from("user_metadata")
      .update({ username: username || null, bio: bio || null, trade_interests: interests, setup_complete: true })
      .eq("id", user.id);

    const [profileRes, metaRes] = await Promise.all([profileUpdate, metadataUpdate]);

    setSaving(false);

    if (profileRes.error || metaRes.error) {
      toast({ title: "Error saving profile", description: (profileRes.error || metaRes.error)?.message, variant: "destructive" });
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-extrabold font-heading text-foreground tracking-tight">
            Kis<span className="text-accent">X</span>
          </a>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                {s === 1 ? "Your Profile" : "Interests"}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          {step === 1 && (
            <>
              <h2 className="text-xl font-heading font-bold text-foreground mb-1">Set up your profile</h2>
              <p className="text-sm text-muted-foreground mb-6">All fields are optional — you can fill these in later.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Username</label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="janesmith" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label>
                  <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A little about you..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">ZIP Code</label>
                    <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="90210" />
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

                <Button className="w-full gap-2" onClick={() => setStep(2)}>
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-heading font-bold text-foreground mb-1">What are your interests?</h2>
              <p className="text-sm text-muted-foreground mb-6">Select the repair categories you care most about.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {TRADE_CATEGORIES.map((cat) => (
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

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button className="flex-1" onClick={handleComplete} disabled={saving}>
                  {saving ? "Saving..." : "Complete Setup"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;
