import { AppLauncher } from "@capacitor/app-launcher";
import { Clipboard } from "@capacitor/clipboard";
import { Capacitor } from "@capacitor/core";

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
