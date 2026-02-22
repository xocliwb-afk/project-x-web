import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import Header from "@/components/Header";
import { ThemeProvider } from "@/context/ThemeContext";
import LeadModalContainer from "@/components/LeadModalContainer";
import Script from "next/script";
import DevAnalyticsPanel from "@/components/DevAnalyticsPanel";

export const metadata: Metadata = {
  title: {
    default: "Brandon Wilcox Home Group",
    template: "%s | Brandon Wilcox Home Group",
  },
  description: "White-label real estate search platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-surface text-text-main antialiased font-sans transition-colors duration-300">
        {recaptchaSiteKey ? (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
              recaptchaSiteKey
            )}`}
            strategy="afterInteractive"
          />
        ) : null}
        <ThemeProvider>
          <Header />
          <LeadModalContainer />
          <main className="relative flex-1 overflow-x-hidden">{children}</main>
          {process.env.NODE_ENV === "development" ||
          process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1" ? (
            <DevAnalyticsPanel />
          ) : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
