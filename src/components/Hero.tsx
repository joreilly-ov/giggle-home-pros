import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-foreground/50" />

      {/* Content */}
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

        {/* Search Bar */}
        <div className="bg-card rounded-lg shadow-xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="What do you need done?"
              className="w-full h-12 pl-10 pr-4 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>
          <input
            type="text"
            placeholder="Zip code"
            className="h-12 w-full sm:w-36 px-4 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
          <Button variant="hero" size="lg" className="h-12 px-8">
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
