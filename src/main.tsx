import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator) {
  if (isInIframe || isPreviewHost) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  } else {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        window.location.reload();
      },
      onOfflineReady() {
        window.dispatchEvent(new Event("kisx:pwa-offline-ready"));
      },
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
