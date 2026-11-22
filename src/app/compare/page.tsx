// src/app/compare/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { CompareClient } from "@/components/compare/CompareClient";

export const metadata: Metadata = {
  title: "Compare AI Models Side-by-Side | OneAtlas",
  description:
    "Compare AI models side-by-side across pricing, context windows, benchmark scores, latency, throughput, and inference providers.",
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="text-xs font-mono text-muted animate-pulse">
            Initializing model comparison matrix...
          </span>
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
