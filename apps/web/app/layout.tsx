import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RouteGuardian — Solana-native autonomous swap agent",
  description:
    "Compares Solana swap routes across Jupiter and Titan, applies scoped policies, and executes through the Zerion CLI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <TopNav />
        <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
          {children}
        </main>
        <footer className="mx-auto max-w-7xl px-6 py-12 text-sm text-ink-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>
              RouteGuardian — Solana &amp; Zerion CLI · MIT
            </span>
            <span className="opacity-60">
              All swaps execute through{" "}
              <code className="rounded bg-purple-mist px-1.5 py-0.5 font-mono">
                zerion swap solana
              </code>
              .
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
