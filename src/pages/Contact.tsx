import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contact = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <div className="bg-foreground">
      <Navbar />
    </div>
    <main className="flex-1 max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-extrabold font-heading text-foreground mb-6">Contact Us</h1>
      <p className="text-muted-foreground mb-8">Got a question, complaint, or just want to say hi? We'd love to hear from you. Reach out using any of the methods below and we'll get back to you faster than you can say "leaky faucet."</p>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold font-heading text-foreground mb-1">Email</h2>
          <p className="text-muted-foreground">support@stablegig.com</p>
        </div>
        <div>
          <h2 className="text-lg font-bold font-heading text-foreground mb-1">Phone</h2>
          <p className="text-muted-foreground">+1 (555) 867-5309</p>
        </div>
        <div>
          <h2 className="text-lg font-bold font-heading text-foreground mb-1">Office</h2>
          <p className="text-muted-foreground">123 Trade Street, Suite 400<br />San Francisco, CA 94123</p>
        </div>
        <div>
          <h2 className="text-lg font-bold font-heading text-foreground mb-1">Hours</h2>
          <p className="text-muted-foreground">Monday – Friday, 8 AM – 6 PM PST<br />Weekend support available for emergencies.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Contact;
