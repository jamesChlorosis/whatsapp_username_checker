import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.local.ogfinder",
  appName: "OG Finder",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#111418",
    },
  },
};

export default config;
