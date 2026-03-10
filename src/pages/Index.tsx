import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div id="how">
        <HowItWorks />
      </div>
      <div id="features">
        <Features />
      </div>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
