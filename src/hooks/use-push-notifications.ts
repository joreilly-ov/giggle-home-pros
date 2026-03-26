import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

const LS_KEY = "push_subscribed";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

type PushState = "prompt" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PushState>("prompt");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermissionState("unsupported");
      return;
    }
    setPermissionState(Notification.permission as PushState);
    setEnabled(localStorage.getItem(LS_KEY) === "true");
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setLoading(true);
    try {
      // 1. Get VAPID key
      const { vapid_public_key } = await api.notifications.vapidKey();

      // 2. Register service worker
      const registration = await navigator.serviceWorker.register("/push-sw.js");
      await navigator.serviceWorker.ready;

      // 3. Subscribe
      const urlBase64 = vapid_public_key.replace(/-/g, "+").replace(/_/g, "/");
      const raw = atob(urlBase64);
      const applicationServerKey = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) applicationServerKey[i] = raw.charCodeAt(i);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // 4. Send to backend
      const p256dh = arrayBufferToBase64(subscription.getKey("p256dh")!);
      const auth_key = arrayBufferToBase64(subscription.getKey("auth")!);
      await api.notifications.subscribe(subscription.endpoint, p256dh, auth_key);

      localStorage.setItem(LS_KEY, "true");
      setEnabled(true);
      setPermissionState("granted");
    } catch {
      // permission denied or network error
      setPermissionState(Notification.permission as PushState);
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const p256dh = arrayBufferToBase64(subscription.getKey("p256dh")!);
          const auth_key = arrayBufferToBase64(subscription.getKey("auth")!);
          await api.notifications.unsubscribe(subscription.endpoint, p256dh, auth_key);
          await subscription.unsubscribe();
        }
      }
      localStorage.removeItem(LS_KEY);
      setEnabled(false);
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  return { enabled, loading, permissionState, subscribe, unsubscribe };
}
