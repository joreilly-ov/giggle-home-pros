import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <div className="bg-foreground">
      <Navbar />
    </div>
    <main className="flex-1 max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-extrabold font-heading text-foreground mb-6">About StableGig</h1>
      <p className="text-muted-foreground mb-4">StableGig was founded with a simple mission: make it ridiculously easy for homeowners to find trustworthy contractors — and for contractors to find steady, well-paying work.</p>
      <p className="text-muted-foreground mb-4">We leverage AI-powered video and photo analysis to help diagnose trade issues before a contractor even steps foot on site. This saves everyone time, money, and headaches.</p>
      <h2 className="text-2xl font-bold font-heading text-foreground mt-10 mb-4">Our Team</h2>
      <p className="text-muted-foreground mb-4">We're a scrappy crew of engineers, designers, and former tradespeople who got tired of the broken status quo. Based out of San Francisco, we're backed by a deep belief that technology can bring transparency and fairness to the trades industry.</p>
      <h2 className="text-2xl font-bold font-heading text-foreground mt-10 mb-4">Why Us?</h2>
      <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>AI-driven project scoping saves hours of back-and-forth</li>
        <li>Escrow payments protect both homeowners and contractors</li>
        <li>Verified contractor profiles you can actually trust</li>
        <li>Same-day payouts for completed work</li>
      </ul>
    </main>
    <Footer />
  </div>
);

export default About;
