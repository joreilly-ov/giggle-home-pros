import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!user) return;

    // Check if setup is complete
    supabase
      .from("user_metadata")
      .select("setup_complete")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data && !data.setup_complete) {
          navigate("/setup", { replace: true });
        }
      });

    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <a href="/" className="text-2xl font-extrabold font-heading text-foreground tracking-tight">
            Stable<span className="text-primary">Gig</span>
          </a>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              {profile?.full_name || user.email}
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1">
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground mb-8">Your StableGig dashboard is ready. Features coming soon.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Post a Project", desc: "Describe your home repair with a quick video.", icon: "🎬", link: "/post-project" },
            { title: "Find Contractors", desc: "Browse verified pros in your area.", icon: "🔍", link: "" },
            { title: "My Projects", desc: "Track your active and completed projects.", icon: "📋", link: "" },
          ].map((card) => (
            <div
              key={card.title}
              onClick={() => card.link && navigate(card.link)}
              className={`bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow ${card.link ? "cursor-pointer" : ""}`}
            >
              <span className="text-3xl mb-3 block">{card.icon}</span>
              <h3 className="font-heading font-bold text-foreground mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
