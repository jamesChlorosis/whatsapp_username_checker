import { AppLauncher } from "@capacitor/app-launcher";
import { Clipboard } from "@capacitor/clipboard";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { UsernameStatus } from "./types";

interface ShadowOverlayPlugin {
  hasPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  start(options: { candidates: string; startIndex: number }): Promise<void>;
  stop(): Promise<void>;
  getResults(): Promise<{ results: string }>;
}

const ShadowOverlay = registerPlugin<ShadowOverlayPlugin>("ShadowOverlay");

export async function copyUsername(text: string) {
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: text });
    return;
  }

  await navigator.clipboard.writeText(text);
}

export async function openWhatsApp() {
  if (Capacitor.isNativePlatform()) {
    try {
      await AppLauncher.openUrl({ url: "whatsapp://" });
    } catch {
      await AppLauncher.openUrl({ url: "market://details?id=com.whatsapp" });
    }
    return;
  }

  window.open("whatsapp://", "_blank");
}

export async function ensureShadowOverlayPermission() {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  const current = await ShadowOverlay.hasPermission();
  if (current.granted) {
    return true;
  }

  await ShadowOverlay.requestPermission();
  return false;
}

export async function startShadowOverlay(candidates: string[], startIndex: number) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Shadow overlay only runs in the Android app.");
  }

  const permission = await ShadowOverlay.hasPermission();
  if (!permission.granted) {
    await ShadowOverlay.requestPermission();
    throw new Error("Enable display-over-other-apps permission, then start shadow mode again.");
  }

  await ShadowOverlay.start({
    candidates: JSON.stringify(candidates),
    startIndex,
  });
}

export async function stopShadowOverlay() {
  if (Capacitor.isNativePlatform()) {
    await ShadowOverlay.stop();
  }
}

export async function getShadowResults() {
  if (!Capacitor.isNativePlatform()) {
    return {};
  }

  const response = await ShadowOverlay.getResults();
  return JSON.parse(response.results || "{}") as Record<string, { status: UsernameStatus; timestamp: number }>;
}
