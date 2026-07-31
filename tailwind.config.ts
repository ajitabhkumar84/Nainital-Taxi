import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // Explicit entry as purge insurance for the seasonal theme token strings
    // (already covered by the glob above since it's a .ts file, but the
    // landing page's Tailwind classes are load-bearing enough to pin down).
    "./src/components/landing/themes.ts",
  ],
  theme: {
    extend: {
      colors: {
        // Preview: pastel tokens repointed to a premium-utility palette.
        // Names unchanged so no component needs touching for this test.
        sunshine: {
          DEFAULT: "#1D4ED8", // primary action blue (was pastel yellow)
          50: "#EFF4FF",
          100: "#DBE7FE",
          200: "#BFD3FD",
          300: "#93B4FB",
          400: "#1D4ED8",
          500: "#1E40AF",
          600: "#1E3A8A",
        },
        teal: {
          DEFAULT: "#334155", // secondary slate (was pastel blue)
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#64748B",
          500: "#475569",
          600: "#334155",
        },
        coral: {
          DEFAULT: "#B45309", // warning amber (was pastel coral)
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#D97706",
          500: "#B45309",
          600: "#92400E",
        },
        whatsapp: "#25D366",
        ink: "#0F172A",
        // Background gradient colors — flattened toward white
        sunrise: "#FFFFFF",
        lake: "#F6F8FA",
      },
      fontFamily: {
        display: ["var(--font-chewy)", "Chewy", "cursive"],
        body: ["var(--font-nunito)", "Nunito", "sans-serif"],
      },
      boxShadow: {
        // Preview: hard sticker offsets replaced with soft elevation
        retro: "0 1px 2px rgba(15,23,42,.06)",
        "retro-sm": "0 1px 2px rgba(15,23,42,.06)",
        "retro-lg": "0 8px 28px rgba(15,23,42,.10)",
        "retro-pressed": "0 1px 2px rgba(15,23,42,.06)",
      },
      borderWidth: {
        3: "1px",
      },
      animation: {
        "tilt-hover": "tilt 0.3s ease-in-out forwards",
        "flip-in": "flipIn 0.6s ease-in-out forwards",
        "flip-out": "flipOut 0.6s ease-in-out forwards",
      },
      keyframes: {
        tilt: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-1deg)" },
        },
        flipIn: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        flipOut: {
          "0%": { transform: "rotateY(180deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
      },
      backgroundImage: {
        "sunrise-gradient": "linear-gradient(135deg, #FFF8E7 0%, #E8F4F8 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
