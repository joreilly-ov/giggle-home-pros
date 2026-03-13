import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  variant?: "transparent" | "solid";
}

const Navbar = ({ variant = "transparent" }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  const isSolid = variant === "solid";

  return (
    <nav className={`${isSolid ? "bg-foreground" : "absolute top-0 left-0 right-0"} z-20 px-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        <a href="/" className="text-2xl font-extrabold font-heading text-primary-foreground tracking-tight">
          Stable<span className="text-primary">Gig</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/#how" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">How It Works</a>
          <a href="/#features" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Features</a>
          <Link to="/photo-analyzer" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Photo Analyzer</Link>
          <Link to="/video-analyzer" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Video Analyzer</Link>

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
          <Link to="/photo-analyzer" className="block py-2 text-primary-foreground/90 font-medium">Photo Analyzer</Link>
          <Link to="/video-analyzer" className="block py-2 text-primary-foreground/90 font-medium">Video Analyzer</Link>

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
