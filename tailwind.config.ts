import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Retro Pop Vacation Color Palette
        sunshine: {
          DEFAULT: "#FFD93D",
          50: "#FFF9E6",
          100: "#FFF3CC",
          200: "#FFE799",
          300: "#FFDB66",
          400: "#FFD93D",
          500: "#E6C237",
          600: "#CCAB31",
        },
        teal: {
          DEFAULT: "#4D96FF",
          50: "#EBF3FF",
          100: "#D6E7FF",
          200: "#ADD0FF",
          300: "#85B8FF",
          400: "#4D96FF",
          500: "#3D78CC",
          600: "#2E5A99",
        },
        coral: {
          DEFAULT: "#FF6B6B",
          50: "#FFEFEF",
          100: "#FFDFDF",
          200: "#FFBFBF",
          300: "#FF9F9F",
          400: "#FF6B6B",
          500: "#E65555",
          600: "#CC4040",
        },
        whatsapp: "#25D366",
        ink: "#2D3436",
        // Background gradient colors
        sunrise: "#FFF8E7",
        lake: "#E8F4F8",
      },
      fontFamily: {
        display: ["var(--font-chewy)", "Chewy", "cursive"],
        body: ["var(--font-nunito)", "Nunito", "sans-serif"],
      },
      boxShadow: {
        retro: "4px 4px 0px 0px #2D3436",
        "retro-sm": "2px 2px 0px 0px #2D3436",
        "retro-lg": "6px 6px 0px 0px #2D3436",
        "retro-pressed": "2px 2px 0px 0px #2D3436",
      },
      borderWidth: {
        3: "3px",
      },
      animation: {
        "tilt-hover": "tilt 0.3s ease-in-out forwards",
      },
      keyframes: {
        tilt: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-1deg)" },
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
