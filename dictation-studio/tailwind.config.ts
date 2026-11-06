import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        slide: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.35), 0 8px 40px -8px rgba(99,102,241,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
