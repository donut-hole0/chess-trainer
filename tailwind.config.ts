import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Boutique Slate & Emerald palette
        parchment: "#F9F9F6",
        charcoal: "#161616",
        forest: {
          DEFAULT: "#1A5235",
          hover: "#16472E",
        },
        terracotta: {
          DEFAULT: "#C85A32",
          hover: "#B34E2A",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      boxShadow: {
        hard: "2px 2px 0px 0px rgba(0,0,0,1)",
        "hard-sm": "1px 1px 0px 0px rgba(0,0,0,1)",
        "hard-lg": "4px 4px 0px 0px rgba(0,0,0,1)",
      },
    },
  },
  plugins: [],
};

export default config;
