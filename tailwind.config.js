/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        night: {
          900: "#0F0A1A",
          800: "#1A0E2E",
          700: "#2D1B4E",
          600: "#3D2568",
          500: "#4E3075",
        },
        stargold: "#FFD700",
        moonlight: "#C0C0C0",
        aurora: "#00CED1",
        dream: {
          purple: "#8B5CF6",
          blue: "#3B82F6",
          pink: "#EC4899",
          green: "#10B981",
          orange: "#F59E0B",
          red: "#EF4444",
        },
      },
      fontFamily: {
        serif: ["Noto Serif SC", "serif"],
        sans: ["Noto Sans SC", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "breathe-in": "breatheIn 4s ease-in-out forwards",
        "breathe-hold": "breatheHold 7s ease-in-out forwards",
        "breathe-out": "breatheOut 8s ease-in-out forwards",
        "star-twinkle": "twinkle 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        breatheIn: {
          "0%": { transform: "scale(0.4)", opacity: "0.5" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        breatheHold: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        breatheOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.4)", opacity: "0.5" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
