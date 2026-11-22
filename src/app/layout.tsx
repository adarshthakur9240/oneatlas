// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import { SWRConfigProvider } from "@/components/providers/SWRConfigProvider";
import { CompareProvider } from "@/lib/compare-store";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CompareTray } from "@/components/compare/CompareTray";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://oneatlas.dev";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "OneAtlas — AI Model Discovery & Intelligence Platform",
    template: "%s · OneAtlas",
  },
  description:
    "Comprehensive intelligence on AI models, inference pricing, capabilities, and verified benchmarks. Normalized across OpenRouter and top inference providers.",
  keywords: [
    "AI models",
    "LLM pricing",
    "OpenRouter",
    "AI benchmarks",
    "SWE-bench",
    "MMLU-Pro",
    "inference providers",
  ],
  authors: [{ name: "OneAtlas Team" }],
  creator: "OneAtlas",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "OneAtlas — AI Model Discovery & Intelligence Platform",
    description:
      "Comprehensive intelligence on AI models, inference pricing, capabilities, and verified benchmarks.",
    siteName: "OneAtlas",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneAtlas — AI Model Discovery & Intelligence Platform",
    description:
      "Comprehensive intelligence on AI models, inference pricing, capabilities, and verified benchmarks.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-text selection:bg-cream-card selection:text-cream-text">
        <SWRConfigProvider>
          <CompareProvider>
            {/* Accessible skip link */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 px-3 py-2 bg-cream-card text-cream-text font-mono text-xs rounded-[8px] font-semibold shadow-lg"
            >
              Skip to content
            </a>

            <Navbar />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
            <CompareTray />
          </CompareProvider>
        </SWRConfigProvider>
      </body>
    </html>
  );
}
