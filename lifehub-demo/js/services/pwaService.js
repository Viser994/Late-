/**
 * PWA Service — register service worker and handle app install.
 */

import { showToast } from "../utils/helpers.js";

let deferredInstallPrompt = null;

/** Register service worker for offline + install support */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (err) {
    console.warn("Service worker registration failed:", err);
  }
}

/** Listen for the native install prompt (Android Chrome) */
export function initInstallPrompt(onAvailable) {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    onAvailable?.(true);
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    showToast("LifeHub installed on your phone!", "success");
    onAvailable?.(false);
  });
}

/** Trigger native install dialog (Android/desktop Chrome) */
export async function promptInstall() {
  if (!deferredInstallPrompt) return false;

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return outcome === "accepted";
}

/** Check if app is already installed / running standalone */
export function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

/** Detect platform for install instructions */
export function getPlatform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

/** Can show one-tap install button? */
export function canOneClickInstall() {
  return !!deferredInstallPrompt;
}
