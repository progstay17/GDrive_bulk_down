import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#f4f6fa",
          100: "#e9edf5",
          200: "#cbd6e9",
          300: "#9cb1d7",
          400: "#6888c1",
          500: "#4464a5",
          600: "#334c85",
          700: "#2a3d6b",
          800: "#1e294b",
          900: "#131930",
          950: "#090d1a",
        }
      },
    },
  },
  plugins: [],
};
export default config;
