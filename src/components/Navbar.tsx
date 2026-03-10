import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        <a href="/" className="text-2xl font-extrabold font-heading text-primary-foreground tracking-tight">
          Stable<span className="text-primary">Gig</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">How It Works</a>
          <a href="#features" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Features</a>
          <a href="#" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Sign In</a>
          <Button variant="hero" size="sm">Contractor Sign Up</Button>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-primary-foreground">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-foreground/90 backdrop-blur-sm rounded-lg p-4 mx-2 mb-2">
          <a href="#how" className="block py-2 text-primary-foreground/90 font-medium">How It Works</a>
          <a href="#features" className="block py-2 text-primary-foreground/90 font-medium">Features</a>
          <a href="#" className="block py-2 text-primary-foreground/90 font-medium">Sign In</a>
          <Button variant="hero" size="sm" className="mt-2 w-full">Contractor Sign Up</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
