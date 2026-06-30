/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111418",
        panel: "#181c22",
        line: "#2b313a",
        mint: "#58d68d",
        citron: "#d7f75b",
        coral: "#ff7a66",
        sky: "#79b8ff",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(215, 247, 91, 0.08), 0 18px 80px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
