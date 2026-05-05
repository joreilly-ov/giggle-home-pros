import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { api } from "@/lib/api";

const LS_KEY = "push_subscribed";
const LS_KEY_NATIVE_ENDPOINT = "push_native_endpoint";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/** True when running on iOS (iPhone/iPad) */
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/** True when running as an installed PWA (standalone mode) */
function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export type PushState =
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported"
  | "ios-not-installed"; // iOS Safari requires PWA install before push works

export function usePushNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PushState>("prompt");

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    const init = async () => {
      if (isNative) {
        try {
          const perms = await PushNotifications.checkPermissions();
          if (perms.receive === "granted") {
            setPermissionState("granted");
          } else if (perms.receive === "denied") {
            setPermissionState("denied");
          } else {
            setPermissionState("prompt");
          }
          setEnabled(!!localStorage.getItem(LS_KEY_NATIVE_ENDPOINT));
        } catch {
          setPermissionState("unsupported");
        }
        return;
      }

    // iOS without PWA install: PushManager may be present but push won't work
      if (isIOS() && !isStandalone()) {
        setPermissionState("ios-not-installed");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPermissionState("unsupported");
        return;
      }
      setPermissionState(Notification.permission as PushState);
      setEnabled(localStorage.getItem(LS_KEY) === "true");
    };

    void init();
  }, []);

  const subscribe = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();
    setLoading(true);
    try {
      if (isNative) {
        const perms = await PushNotifications.checkPermissions();
        if (perms.receive === "denied") {
          setPermissionState("denied");
          return;
        }

        if (perms.receive !== "granted") {
          const reqPerms = await PushNotifications.requestPermissions();
          if (reqPerms.receive !== "granted") {
            setPermissionState(reqPerms.receive === "denied" ? "denied" : "prompt");
            return;
          }
        }

        const endpoint = await new Promise<string>(async (resolve, reject) => {
          let done = false;
          const cleanup = async () => {
            await registrationHandle?.remove();
            await errorHandle?.remove();
          };

          const finishResolve = async (value: string) => {
            if (done) return;
            done = true;
            clearTimeout(timeoutId);
            await cleanup();
            resolve(value);
          };

          const finishReject = async (error: Error) => {
            if (done) return;
            done = true;
            clearTimeout(timeoutId);
            await cleanup();
            reject(error);
          };

          const registrationHandle = await PushNotifications.addListener("registration", (token) => {
            void finishResolve(`native:${Capacitor.getPlatform()}:${token.value}`);
          });

          const errorHandle = await PushNotifications.addListener("registrationError", (err) => {
            void finishReject(new Error(err.error ?? "Native push registration failed"));
          });

          const timeoutId = setTimeout(() => {
            void finishReject(new Error("Native push registration timed out"));
          }, 15000);

          await PushNotifications.register();
        });

        await api.notifications.subscribeNative(Capacitor.getPlatform() as "ios" | "android", endpoint.split(":").slice(2).join(":"));
        localStorage.setItem(LS_KEY_NATIVE_ENDPOINT, endpoint);
        localStorage.setItem(LS_KEY, "true");
        setEnabled(true);
        setPermissionState("granted");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

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
      await api.notifications.subscribeWeb(subscription.endpoint, p256dh, auth_key);

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
    const isNative = Capacitor.isNativePlatform();
    setLoading(true);
    try {
      if (isNative) {
        const endpoint = localStorage.getItem(LS_KEY_NATIVE_ENDPOINT);
        if (endpoint) {
          const parts = endpoint.split(":");
          const platform = parts[1] as "ios" | "android";
          const token = parts.slice(2).join(":");
          await api.notifications.unsubscribeNative(platform, token);
        }

        try {
          await PushNotifications.removeAllListeners();
          await (PushNotifications as any).unregister?.();
        } catch {
          // best-effort
        }

        localStorage.removeItem(LS_KEY_NATIVE_ENDPOINT);
        localStorage.removeItem(LS_KEY);
        setEnabled(false);
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const p256dh = arrayBufferToBase64(subscription.getKey("p256dh")!);
          const auth_key = arrayBufferToBase64(subscription.getKey("auth")!);
          await api.notifications.unsubscribeWeb(subscription.endpoint, p256dh, auth_key);
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
