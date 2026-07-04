import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8FC",
        ink: "#241E38",
        violet: {
          DEFAULT: "#7C5CFC",
          soft: "#EFE9FE",
          deep: "#5B3FD9",
        },
        pink: {
          DEFAULT: "#F45BA0",
          soft: "#FDE9F2",
        },
        blue: {
          DEFAULT: "#4E8CF0",
          soft: "#E9F1FE",
        },
        mist: "#B7B0C9",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 14px rgba(124, 92, 252, 0.08)",
        pop: "0 12px 32px rgba(36, 30, 56, 0.16)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        stamp: {
          "0%": { transform: "scale(0.4) rotate(-12deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        stamp: "stamp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "pop-in": "pop-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
