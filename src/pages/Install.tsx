import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-foreground">
            Install Giggle Home Pros
          </h1>
          <p className="text-muted-foreground">
            Add Giggle Home Pros to your home screen for quick access, offline support, and a native app experience — no app store needed.
          </p>

          {isInstalled ? (
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">App is installed!</span>
            </div>
          ) : deferredPrompt ? (
            <Button size="lg" onClick={handleInstall} className="gap-2">
              <Download className="w-5 h-5" />
              Install App
            </Button>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">To install manually:</p>
              <ul className="space-y-2 text-left max-w-xs mx-auto">
                <li><strong>iPhone:</strong> Tap Share → "Add to Home Screen"</li>
                <li><strong>Android:</strong> Tap the browser menu → "Install app"</li>
                <li><strong>Desktop:</strong> Click the install icon in the address bar</li>
              </ul>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Install;
