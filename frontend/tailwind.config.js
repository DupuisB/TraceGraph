/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        mistral: {
          bg: "#020617", // Deep Void (main background)
          surface: "#0F172A", // Card Background
          border: "#1E293B", // Subtle Borders
          gold: "#F59E0B", // Primary Brand Accent
          pale: "#F8FAFC", // Primary Text
        },
        status: {
          verified: "#10B981", // Emerald 500
          refuted: "#F43F5E", // Rose 500
          review: "#94A3B8", // Slate 400 (Administrative/Neutral)
        },
      },
    },
  },
  plugins: [],
};
