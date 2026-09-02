/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        camly: {
          black: "#141210",
          charcoal: "#1E1B18",
          line: "#35302B",
          ink: "#F5F1EA",
          inkMuted: "#A69C8D",
          accent: "#FF5A1F",
          accentSoft: "#FFB08A",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "\"Hiragino Kaku Gothic ProN\"", "\"Yu Gothic\"", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
