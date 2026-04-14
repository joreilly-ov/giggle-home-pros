import { Link } from "react-router-dom";
import {
  Banknote,
  ShieldCheck,
  Clock,
  Zap,
  Lock,
  CheckCircle2,
  Building2,
  ArrowRight,
  BadgeCheck,
  AlertCircle,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const paymentSteps = [
  {
    icon: CheckCircle2,
    title: "Bid accepted",
    description:
      "You accept a contractor's bid. The agreed amount is charged to your card and held securely — not yet released to anyone.",
  },
  {
    icon: Lock,
    title: "Funds held in escrow",
    description:
      "Money sits in a protected escrow account powered by Stripe. The contractor can see it's there; no one can touch it until the job is done.",
  },
  {
    icon: Zap,
    title: "Work gets done",
    description:
      "The contractor completes the project. You review it in the app, leave feedback, and confirm you're satisfied.",
  },
  {
    icon: Banknote,
    title: "You release payment",
    description:
      "One tap releases the funds. Stripe routes the money directly to the contractor's verified bank account.",
  },
  {
    icon: Clock,
    title: "Contractor paid same day",
    description:
      "The payout lands in the contractor's account the same day — often within minutes. No chasing invoices, no waiting weeks.",
  },
];

const homeownerBenefits = [
  {
    icon: ShieldCheck,
    title: "Your money is protected",
    description:
      "Funds are never released until you confirm the work is complete. You are always in control.",
  },
  {
    icon: RefreshCw,
    title: "Dispute resolution",
    description:
      "If something goes wrong, the funds are held while the issue is investigated — not sent and then chased back.",
  },
  {
    icon: BadgeCheck,
    title: "Stripe-verified contractors",
    description:
      "Every contractor completes Stripe's identity verification before they can receive a single payment. No anonymous tradespeople.",
  },
  {
    icon: AlertCircle,
    title: "No surprise charges",
    description:
      "You see the full amount upfront when you accept a bid. That amount is fixed — no add-ons after the job is done without your approval.",
  },
];

const contractorBenefits = [
  {
    icon: Zap,
    title: "Same-day payouts",
    description:
      "As soon as the homeowner approves the work, the payment is on its way. Typical arrival: same business day.",
  },
  {
    icon: Building2,
    title: "Direct to your bank",
    description:
      "Stripe Connect deposits straight into your nominated bank account. No third-party wallets, no delays cashing out.",
  },
  {
    icon: Wallet,
    title: "Full earnings transparency",
    description:
      "See exactly what you'll receive before you bid — platform fee shown clearly. No hidden deductions.",
  },
  {
    icon: Lock,
    title: "Guaranteed payment",
    description:
      "Funds are already held in escrow before you start work. You'll never complete a job and discover the customer can't pay.",
  },
];

const trustItems = [
  {
    label: "Stripe",
    detail: "Payments infrastructure trusted by millions of businesses worldwide",
  },
  {
    label: "Escrow protection",
    detail: "Funds held securely — released only when both parties are satisfied",
  },
  {
    label: "KYC verified",
    detail: "Every contractor passes Stripe's identity and bank verification",
  },
  {
    label: "PCI DSS compliant",
    detail: "Card data is handled entirely by Stripe — KisX never stores payment details",
  },
];

const SameDayPayments = () => (
  <div className="min-h-screen flex flex-col page-bg">
    <Navbar variant="solid" />

    {/* Hero */}
    <section className="bg-foreground text-primary-foreground py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          <Zap className="w-4 h-4" />
          Powered by Stripe Connect
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold font-heading leading-tight mb-5">
          Get paid the same day.<br />
          <span className="text-primary">Every time.</span>
        </h1>
        <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          KisX combines Stripe's world-class payment infrastructure with escrow
          protection — so homeowners only pay when they're satisfied, and
          contractors never wait weeks for their money.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="h-12 px-8">
            <Link to="/contractor/signup">Join as a Contractor</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/post-project">Post a Project</Link>
          </Button>
        </div>
      </div>
    </section>

    {/* How payment flows */}
    <section className="py-20 px-4 bg-background">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-extrabold font-heading text-foreground text-center mb-3">
          How the money flows
        </h2>
        <p className="text-center text-muted-foreground mb-14 max-w-lg mx-auto">
          Escrow means both sides are protected at every step. Here's exactly what happens from bid to bank account.
        </p>

        <div className="relative flex flex-col gap-0">
          {paymentSteps.map((step, i) => (
            <div key={step.title} className="flex gap-5">
              {/* Timeline spine */}
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                {i < paymentSteps.length - 1 && (
                  <div className="w-px flex-1 bg-border my-1" />
                )}
              </div>
              {/* Content */}
              <div className={`pb-8 ${i < paymentSteps.length - 1 ? "" : ""}`}>
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Step {i + 1}
                </div>
                <h3 className="font-heading font-bold text-foreground text-lg mb-1">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Homeowner benefits */}
    <section className="py-20 px-4 bg-secondary">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold font-heading text-foreground mb-3">
            For homeowners — pay with confidence
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your money never leaves escrow until you say so. You're protected
            from start to finish.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {homeownerBenefits.map((b) => (
            <div
              key={b.title}
              className="bg-card rounded-xl p-7 border border-border shadow-sm"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground mb-2">
                {b.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Contractor benefits */}
    <section className="py-20 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold font-heading text-foreground mb-3">
            For contractors — fast, guaranteed pay
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Finish the job, get approved, get paid. No invoices, no chasing,
            no waiting until Friday.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contractorBenefits.map((b) => (
            <div
              key={b.title}
              className="bg-card rounded-xl p-7 border border-border shadow-sm"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground mb-2">
                {b.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Payout timing callout */}
    <section className="py-16 px-4 bg-primary">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold font-heading text-primary-foreground mb-4">
          How fast is same-day?
        </h2>
        <p className="text-primary-foreground/80 mb-10 max-w-lg mx-auto">
          Once the homeowner taps "Release Payment", Stripe processes the transfer immediately.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { time: "Minutes", label: "Instant payout", note: "Available to eligible contractors" },
            { time: "Same day", label: "Standard payout", note: "For most UK bank accounts" },
            { time: "1–2 days", label: "Fallback", note: "Some banks or international accounts" },
          ].map((t) => (
            <div key={t.label} className="bg-primary-foreground/10 rounded-xl p-6 text-center">
              <div className="text-2xl font-extrabold font-heading text-primary-foreground mb-1">
                {t.time}
              </div>
              <div className="text-sm font-semibold text-primary-foreground/90 mb-1">
                {t.label}
              </div>
              <div className="text-xs text-primary-foreground/50">{t.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Trust & compliance */}
    <section className="py-20 px-4 bg-secondary">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-extrabold font-heading text-foreground text-center mb-3">
          Built on proven infrastructure
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          We don't build our own payment rails. We use Stripe — the same platform
          that powers Amazon, Shopify, and thousands of other businesses.
        </p>
        <div className="flex flex-col gap-4">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 bg-card rounded-xl px-6 py-5 border border-border"
            >
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">{item.label} — </span>
                <span className="text-muted-foreground text-sm">{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 px-4 bg-background">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold font-heading text-foreground mb-4">
          Ready to get started?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Homeowners post projects for free. Contractors sign up and connect
          their bank account in under five minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="h-12 px-8">
            <Link to="/contractor/signup">
              Set up contractor payments <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8">
            <Link to="/how-escrow-works">How escrow works</Link>
          </Button>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default SameDayPayments;
