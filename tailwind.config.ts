import type { Config } from "tailwindcss";

/**
 * Color utilities map to CSS custom properties defined in app/globals.css.
 * The single source of truth for the palette is lib/theme/colors.ts, which
 * generates those CSS variables. Changing the brand palette is a one-file edit.
 *
 * The `rgb(var(--x) / <alpha-value>)` pattern keeps Tailwind opacity modifiers
 * (e.g. `bg-brand/20`) working.
 */
const withVar = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

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
        brand: {
          DEFAULT: withVar("--c-brand"),
          fg: withVar("--c-brand-fg"),
        },
        accent: {
          DEFAULT: withVar("--c-accent"),
          fg: withVar("--c-accent-fg"),
        },
        highlight: withVar("--c-highlight"),
        bg: withVar("--c-bg"),
        surface: withVar("--c-surface"),
        "surface-2": withVar("--c-surface-2"),
        border: withVar("--c-border"),
        content: {
          DEFAULT: withVar("--c-text"),
          muted: withVar("--c-text-muted"),
        },
        success: withVar("--c-success"),
        danger: withVar("--c-danger"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 24px -4px rgb(0 0 0 / 0.1)",
        glow: "0 0 0 1px rgb(var(--c-brand) / 0.3), 0 16px 40px -8px rgb(var(--c-brand) / 0.2)",
        glass: "0 8px 32px rgb(0 0 0 / 0.12)",
        "glass-dark": "0 8px 32px rgb(0 0 0 / 0.3)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      spacing: {
        "section": "120px",
        "section-lg": "160px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
