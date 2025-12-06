import type { Config } from "tailwindcss";
import theme from "../../config/theme.json";

const config: Config = {
  darkMode: "media", // This makes it follow system preference automatically
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: theme.colors.primary,
        "primary-accent": theme.colors.primaryAccent,
        background: theme.colors.background,
        surface: theme.colors.surface,
        "text-main": theme.colors.textMain,
        "text-muted": theme.colors.textMuted,
        border: theme.colors.border,
        danger: theme.colors.danger,
        success: theme.colors.success,
      },
      fontFamily: {
        sans: theme.typography.fontFamily.split(",").map((s) => s.trim()),
      },
      borderRadius: {
        card: `${theme.radius.card}px`,
        button: `${theme.radius.button}px`,
        input: `${theme.radius.input}px`,
      },
    },
  },
  plugins: [],
};
export default config;