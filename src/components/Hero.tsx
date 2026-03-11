import { useState, useCallback } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Hero = () => {
  const [zip, setZip] = useState("");
  const [location, setLocation] = useState("");
  const [zipLoading, setZipLoading] = useState(false);

  const lookupZip = useCallback(async (code: string) => {
    if (!/^\d{5}$/.test(code)) return;
    setZipLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("zip-lookup", {
        body: { zip: code },
      });
      if (!error && data?.city) {
        setLocation(`${data.city}, ${data.state}`);
      } else {
        setLocation("");
      }
    } catch {
      setLocation("");
    } finally {
      setZipLoading(false);
    }
  }, []);

  const handleZipChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 5);
    setZip(cleaned);
    setLocation("");
    if (cleaned.length === 5) lookupZip(cleaned);
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-foreground/50" />

      <div className="relative z-10 text-center px-4 w-full max-w-3xl mx-auto animate-fade-up">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-4 leading-tight tracking-tight">
          Your home project,
          <br />
          <span className="text-primary">done right.</span>
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-xl mx-auto font-body">
          Describe your project on video. Get bids from trusted contractors.
          Pay safely through escrow.
        </p>

        <div className="bg-card rounded-lg shadow-xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="What do you need done?"
              className="w-full h-12 pl-10 pr-4 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              value={zip}
              onChange={(e) => handleZipChange(e.target.value)}
              placeholder="Zip code"
              inputMode="numeric"
              maxLength={5}
              className="h-12 w-full sm:w-36 px-4 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
            {zipLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button variant="hero" size="lg" className="h-12 px-8">
            Get Started
          </Button>
        </div>

        {location && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-primary-foreground/70 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
