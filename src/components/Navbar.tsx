import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface NavbarProps {
  variant?: "transparent" | "solid";
}

const Navbar = ({ variant = "transparent" }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setDisplayName(null); return; }
    supabase.from("contractors" as any).select("business_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data && (data as any).business_name) {
          setDisplayName((data as any).business_name);
        } else {
          supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
            .then(({ data: p }) => {
              setDisplayName(p?.full_name || user.email?.split("@")[0] || "User");
            });
        }
      });
  }, [user]);

  const isSolid = variant === "solid";

  return (
    <nav className={`${isSolid ? "bg-foreground" : "absolute top-0 left-0 right-0"} z-20 px-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        <a href="/" className="text-2xl font-extrabold font-heading text-primary-foreground tracking-tight">
          Kis<span className="text-accent">X</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/#how" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">How It Works</a>
          <a href="/#features" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Features</a>

          {!loading && !user && (
            <>
              <Link to="/auth" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Sign In</Link>
              <Link to="/auth">
                <Button variant="hero" size="sm">Sign Up</Button>
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              <span className="text-xs font-medium text-primary-foreground/60 truncate max-w-[140px]">
                {displayName ?? user.email}
              </span>
              <Link to="/dashboard" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Dashboard</Link>
              <Link to="/profile" className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <User className="w-4 h-4" /> Profile
              </Link>
              <Button variant="hero" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-primary-foreground">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-foreground/90 backdrop-blur-sm rounded-lg p-4 mx-2 mb-2">
          <a href="/#how" className="block py-2 text-primary-foreground/90 font-medium">How It Works</a>
          <a href="/#features" className="block py-2 text-primary-foreground/90 font-medium">Features</a>

          {!loading && !user && (
            <>
              <Link to="/auth" className="block py-2 text-primary-foreground/90 font-medium">Sign In</Link>
              <Link to="/auth">
                <Button variant="hero" size="sm" className="mt-2 w-full">Sign Up</Button>
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              <div className="px-2 py-1.5 rounded bg-primary/10 mb-1">
                <p className="text-xs font-medium text-primary-foreground/80 truncate">{displayName ?? user.email}</p>
              </div>
              <Link to="/dashboard" className="block py-2 text-primary-foreground/90 font-medium">Dashboard</Link>
              <Link to="/profile" className="block py-2 text-primary-foreground/90 font-medium">Profile</Link>
              <button onClick={signOut} className="block py-2 text-primary-foreground/90 font-medium">Sign Out</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
