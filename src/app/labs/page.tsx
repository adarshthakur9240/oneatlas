// src/app/labs/page.tsx
// Server Component for Labs Discovery Catalog

import { Suspense } from "react";
import type { Metadata } from "next";
import { listLabs } from "@/server/services/labs";
import { LabsClient } from "@/components/labs/LabsClient";
import { Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Research Labs & Creators | OneAtlas",
  description:
    "Explore AI research labs, creator portfolios, release cadences, and open-weight model architectures.",
};

export default async function LabsPage() {
  const labs = await listLabs();

  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-border">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted mb-2">
            <Cpu className="w-3.5 h-3.5 text-accent-warn" />
            <span>Research Organizations &amp; Model Creators</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text tracking-tight">
            AI Research Labs
          </h1>
          <p className="text-sm text-muted mt-2 max-w-2xl font-sans">
            Directory of {labs.length} artificial intelligence labs, Frontier foundations, and open-source creator ecosystems.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-24 text-center text-xs font-mono text-muted animate-pulse">
              Loading AI lab directory...
            </div>
          }
        >
          <LabsClient initialLabs={labs} />
        </Suspense>
      </div>
    </div>
  );
}
