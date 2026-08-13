import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // light / public surfaces
        ink: "#151515",
        lime: "#c9ff58",
        cream: "#f7f4ed",
        grape: "#8566ff",
        "grape-dark": "#7055e8",
        "grape-light": "#b9a9ff",

        // dark / product surfaces
        surface: "#090b0d",
        "surface-header": "#0d1014",
        "surface-neon": "#0f1115",
        card: "#101318",
        "card-border": "#171a1f",
        "lime-neon": "#c6ff3d",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-unbounded)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--rot, 0deg))" },
          "50%": { transform: "translateY(-10px) rotate(var(--rot, 0deg))" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%, 100%": { opacity: ".55" },
          "50%": { opacity: ".8" },
        },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.2,.8,.2,1) both",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 24s linear infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
