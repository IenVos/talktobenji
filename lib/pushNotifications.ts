/**
 * Client-side helpers voor Push Notificaties
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

/** Check of push notificaties worden ondersteund */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Huidige notification permission status */
export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/** Registreer de service worker */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (error) {
    console.error("Service worker registratie mislukt:", error);
    return null;
  }
}

/** Vraag toestemming en maak een push subscription aan */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return null;

  try {
    // Vraag toestemming
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // Registreer service worker
    const registration = await registerServiceWorker();
    if (!registration) return null;

    // Wacht tot service worker actief is
    await navigator.serviceWorker.ready;

    // Check bestaande subscription
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) return existingSub;

    // Maak nieuwe subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    return subscription;
  } catch (error) {
    console.error("Push subscription mislukt:", error);
    return null;
  }
}

/** Verwijder de push subscription */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    return true;
  } catch (error) {
    console.error("Push unsubscribe mislukt:", error);
    return false;
  }
}

/** Converteer VAPID public key van base64 naar Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
