import { Video, Bot, ShieldCheck, Banknote, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Video,
    title: "Describe Your Project",
    description: "Record a short video walkthrough of what you need done. It's faster and clearer than typing.",
  },
  {
    icon: Bot,
    title: "Contractors Bid with AI",
    description: "Qualified contractors use AI-assisted tools to send you accurate, competitive bids quickly.",
  },
  {
    icon: ShieldCheck,
    title: "Funds Held in Escrow",
    description: "Your money is safely held until you approve the completed work. No surprises.",
  },
  {
    icon: CheckCircle,
    title: "Approve the Work",
    description: "Review the finished project and release payment when you're satisfied.",
  },
  {
    icon: Banknote,
    title: "Same-Day Pay",
    description: "Contractors get paid the same day you approve — fast, fair, and reliable.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          How it works
        </h2>
        <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
          From project description to payment — simple, transparent, and secure.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-sm font-bold text-primary mb-1">Step {i + 1}</div>
              <h3 className="font-heading font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
