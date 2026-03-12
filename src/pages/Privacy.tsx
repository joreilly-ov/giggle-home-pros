import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <div className="bg-foreground">
      <Navbar />
    </div>
    <main className="flex-1 max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-extrabold font-heading text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 12, 2026</p>

      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-bold font-heading text-foreground mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly, such as your name, email address, postal code, and project details. We also collect usage data automatically, including IP addresses, browser type, and pages visited.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold font-heading text-foreground mb-2">2. How We Use Your Information</h2>
          <p>Your information is used to provide and improve our services, match you with contractors, process payments, and communicate with you about your account and projects.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold font-heading text-foreground mb-2">3. Sharing of Information</h2>
          <p>We do not sell your personal information. We may share data with contractors you engage with, payment processors, and service providers who help us operate the platform.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold font-heading text-foreground mb-2">4. Data Security</h2>
          <p>We implement industry-standard security measures including encryption, secure servers, and regular audits. However, no method of transmission over the internet is 100% secure.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold font-heading text-foreground mb-2">5. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at support@stablegig.com.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold font-heading text-foreground mb-2">6. Contact</h2>
          <p>If you have questions about this policy, contact us at support@stablegig.com or 123 Trade Street, Suite 400, San Francisco, CA 94123.</p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
