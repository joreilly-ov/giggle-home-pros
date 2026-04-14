import { useEffect, useState } from "react";
import { version } from "../../package.json";

interface SplashScreenProps {
  onDone: () => void;
}

const SplashScreen = ({ onDone }: SplashScreenProps) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1800);
    const doneTimer = setTimeout(() => onDone(), 2300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-foreground"
      style={{
        transition: "opacity 500ms ease-out",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Wordmark */}
        <h1 className="text-5xl font-extrabold font-heading text-primary-foreground tracking-tight">
          Kis<span className="text-primary">X</span>
        </h1>

        <p className="text-primary-foreground/60 text-sm tracking-wide uppercase">
          Home Services Marketplace
        </p>

        {/* Spinner */}
        <div className="mt-4 w-6 h-6 border-2 border-primary-foreground/20 border-t-primary rounded-full animate-spin" />
      </div>

      {/* Version badge — bottom of screen */}
      <p className="absolute bottom-8 text-primary-foreground/30 text-xs">
        v{version}
      </p>
    </div>
  );
};

export default SplashScreen;
