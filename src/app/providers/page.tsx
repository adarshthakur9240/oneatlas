// src/app/providers/page.tsx
// Server Component for Providers Directory

import { Suspense } from "react";
import type { Metadata } from "next";
import { listProviders } from "@/server/services/providers";
import { ProvidersClient } from "@/components/providers/ProvidersClient";
import { Layers } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Inference Providers & APIs | OneAtlas",
  description:
    "Compare inference API providers by hosted models, latency, throughput, uptime SLAs, and endpoint pricing.",
};

export default async function ProvidersPage() {
  const providers = await listProviders();

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen py-8 sm:py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="pb-6 border-b border-border">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted mb-2">
            <Layers className="w-3.5 h-3.5 text-accent-warn" />
            <span>Infrastructure &amp; Hosting Endpoints</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text tracking-tight">
            Inference Providers
          </h1>
          <p className="text-sm text-muted mt-2 max-w-2xl font-sans">
            Compare latency, throughput, uptime reliability, and per-token pricing across {providers.length} global inference hosts.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-24 text-center text-xs font-mono text-muted animate-pulse">
              Loading inference provider directory...
            </div>
          }
        >
          <ProvidersClient initialProviders={providers} />
        </Suspense>
      </div>
    </div>
  );
}
