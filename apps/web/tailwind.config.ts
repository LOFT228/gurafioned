import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * RouteGuardian — Storytale-inspired design system.
 *
 * Cream canvas, deep purple primary, orange + yellow accents. Thin-outline
 * illustration aesthetic, chunky offset-shadow buttons, big typography.
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FBF6E9",
          deep: "#F4EDD3",
        },
        ink: {
          DEFAULT: "#1A1A2E",
          soft: "#3B3B5C",
        },
        purple: {
          DEFAULT: "#4F3CC9",
          ink: "#2E2073",
          soft: "#7A68E0",
          mist: "#E2DCFB",
        },
        orange: {
          DEFAULT: "#FF6B35",
          soft: "#FFE0D2",
        },
        yellow: {
          DEFAULT: "#FFCB47",
          soft: "#FFF1C2",
        },
        mint: {
          DEFAULT: "#7BD389",
          soft: "#D8F1DC",
        },
        sky: {
          DEFAULT: "#7DD3FC",
          soft: "#DDF1FB",
        },
        coral: {
          DEFAULT: "#FF8FA3",
          soft: "#FFE0E6",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui"],
        display: ['"Inter"', "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        petal: "2rem",
        "petal-lg": "2.5rem",
      },
      boxShadow: {
        chunky: "6px 6px 0px 0px #2E2073",
        "chunky-sm": "3px 3px 0px 0px #2E2073",
        "chunky-orange": "6px 6px 0px 0px #FF6B35",
        soft: "0 4px 20px rgba(46, 32, 115, 0.08)",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
      },
      animation: {
        wiggle: "wiggle 4s ease-in-out infinite",
        twinkle: "twinkle 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
