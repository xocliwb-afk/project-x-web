import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { ThemeProvider } from "@/context/ThemeContext";
import LeadModalContainer from "@/components/LeadModalContainer";

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
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-surface text-text-main antialiased font-sans transition-colors duration-300">
        <ThemeProvider>
          <Header />
          <LeadModalContainer />
          <main className="relative flex-1 overflow-x-hidden">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
