/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "brand-navy": "var(--brand-navy)",
        "brand-copper": "var(--accent-copper)",
      },
    },
  },
  plugins: [],
};
