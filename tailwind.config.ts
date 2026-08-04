import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#151515", lime: "#c9ff58", cream: "#f7f4ed" } } },
  plugins: [],
} satisfies Config;
