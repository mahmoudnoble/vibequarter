import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * VibeQuarter brand → Tailwind. Jade brand, electric indigo + cyan accents,
 * cool-slate "ink" neutrals. Semantic tokens (background/foreground/card/…) are
 * CSS vars in globals.css. The landing alternates fixed dark/light section
 * "tones" (see .tone-* in globals.css) rather than a single theme.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        jade: {
          50: "#ECFDF6", 100: "#D2F8E6", 200: "#A4EFCE", 300: "#66E0B2",
          400: "#2ECB94", 500: "#10B981", 600: "#0E9C6D", 700: "#0B7B57",
          800: "#0A5F44", 900: "#084A36", 950: "#042A1F",
        },
        indigo: {
          50: "#EEF0FF", 100: "#E1E4FF", 200: "#C6CBFF", 300: "#A4A9FF",
          400: "#8086FB", 500: "#5B5BF2", 600: "#4A45DE", 700: "#3A34BB", 900: "#221F73",
        },
        cyan: {
          50: "#E7FBFE", 100: "#C9F4FB", 200: "#98E9F5", 300: "#5FD7EC",
          400: "#2BC1DC", 500: "#12A6C6", 600: "#0D83A0",
        },
        ink: {
          0: "#FFFFFF", 50: "#F5F8FB", 100: "#ECF1F6", 200: "#DAE2EB", 300: "#BFCAD7",
          400: "#909FB2", 500: "#5F6F81", 600: "#44525F", 700: "#313D49", 800: "#1D2731",
          900: "#121A23", 950: "#0A0F16",
        },
        // semantic (theme-aware via CSS vars)
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-arabic)", "sans-serif"],
        body: ["var(--font-body)", "var(--font-arabic)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        arabic: ["var(--font-arabic)", "sans-serif"],
      },
      fontSize: {
        // fluid display steps used by hero / section titles
        "display-sm": ["clamp(2.2rem, 6vw, 3.5rem)", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(2.6rem, 7.5vw, 5rem)", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
        "display-lg": ["clamp(3rem, 9vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
      },
      letterSpacing: {
        tighter: "-0.04em", tight: "-0.02em", wide: "0.04em", wider: "0.12em",
      },
      borderRadius: { xl: "16px", "2xl": "20px", "3xl": "28px", "4xl": "36px" },
      maxWidth: { container: "1200px", "container-xl": "1320px" },
      boxShadow: {
        soft: "0 1px 2px rgba(18,26,35,0.04), 0 8px 24px rgba(18,26,35,0.06)",
        card: "0 1px 3px rgba(18,26,35,0.06), 0 12px 32px rgba(18,26,35,0.07)",
        brand: "0 14px 34px rgba(16,185,129,0.28)",
        "brand-lg": "0 22px 60px -12px rgba(16,185,129,0.45)",
        lift: "0 24px 60px rgba(18,26,35,0.14)",
        "glass": "0 8px 32px rgba(10,15,22,0.12), inset 0 1px 0 rgba(255,255,255,0.4)",
        "glass-dark": "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "marquee-rev": { "0%": { transform: "translateX(-50%)" }, "100%": { transform: "translateX(0)" } },
        "caret-blink": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        "float-slow": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-22px)" } },
        "pulse-glow": {
          "0%,100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.06)" },
        },
        "gradient-pan": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "border-flow": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        marquee: "marquee var(--marquee-duration, 34s) linear infinite",
        "marquee-rev": "marquee-rev var(--marquee-duration, 34s) linear infinite",
        "caret-blink": "caret-blink 1s step-end infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        "pulse-glow": "pulse-glow 6s ease-in-out infinite",
        "gradient-pan": "gradient-pan 8s ease-in-out infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        "border-flow": "border-flow 6s linear infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
