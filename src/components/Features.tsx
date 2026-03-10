import { Video, Shield, Zap, Star } from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Video-First Projects",
    description: "Show contractors exactly what you need with a quick video. No more misunderstandings from text descriptions.",
  },
  {
    icon: Zap,
    title: "AI-Powered Bidding",
    description: "Contractors use smart tools to analyze your project and deliver precise estimates — faster than ever.",
  },
  {
    icon: Shield,
    title: "Escrow Protection",
    description: "Your money stays safe until you confirm the work meets your standards. Full transparency, zero risk.",
  },
  {
    icon: Star,
    title: "Vetted Contractors",
    description: "Every contractor is verified with license checks, reviews, and performance history before joining.",
  },
];

const Features = () => {
  return (
    <section className="py-20 px-4 bg-secondary">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          Why homeowners love StableGig
        </h2>
        <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
          Built to make hiring contractors stress-free and transparent.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-border"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-heading text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
