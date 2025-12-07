import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Project X - Real Estate Search",
  description: "White-label real estate search platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col overflow-hidden bg-surface text-text-main antialiased font-sans transition-colors duration-300">
        <ThemeProvider>
          <Header />
          <main className="relative flex-1 overflow-hidden">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
