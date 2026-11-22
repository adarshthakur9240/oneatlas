// src/app/providers/[slug]/page.tsx
// Server Component for Provider Profile & Hosted Model Endpoints

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProviderBySlug } from "@/server/services/providers";
import { formatPrice, formatContext } from "@/lib/formatters";
import { StatTile } from "@/components/ui/StatTile";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { NotFoundError } from "@/lib/api-response";
import { Globe, ArrowRight } from "lucide-react";

interface ProviderPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const { slug } = await params;
  let provider;
  try {
    provider = await getProviderBySlug(slug);
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }

  const title = `${provider.name} Inference Hosting & Model Endpoints | OneAtlas`;
  const description = `Inspect ${provider.name}'s ${provider.hostedModelCount} hosted model endpoints, pricing, latency, and throughput on OneAtlas.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params;

  let provider;
  try {
    provider = await getProviderBySlug(slug);
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="pb-8 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-[12px] bg-surface-raised border border-border flex items-center justify-center font-mono text-base font-bold text-muted shrink-0">
                {provider.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="space-y-1">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text tracking-tight">
                  {provider.name}
                </h1>
                <div className="flex items-center gap-3 text-xs font-mono text-muted">
                  {provider.website && (
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-text hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{new URL(provider.website).hostname}</span>
                    </a>
                  )}
                  <span>· {provider.hostedModelCount} Hosted Models</span>
                </div>
                {provider.description && (
                  <p className="text-sm text-muted font-sans max-w-3xl pt-1">
                    {provider.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile
            label="Hosted Models"
            value={provider.hostedModelCount}
            subtext="Active endpoints"
          />
          <StatTile
            label="Lowest Host On"
            value={provider.cheapestCount}
            subtext="Best-price models"
          />
          <StatTile
            label="Avg Latency p50"
            value={provider.avgLatencyMs !== null ? `${provider.avgLatencyMs}ms` : "—"}
            subtext="Observed TTFT"
          />
          <StatTile
            label="Avg Throughput"
            value={provider.avgThroughputTps !== null ? `${provider.avgThroughputTps.toFixed(1)} tps` : "—"}
            subtext="Generation speed"
          />
        </div>

        {/* Hosted Models Table */}
        <div className="space-y-4">
          <SectionHeader
            title="Hosted Endpoints &amp; Models"
            subtitle={`Full list of AI models served by ${provider.name} with quantization and pricing.`}
            count={provider.hostedModels.length}
          />

          <div className="w-full overflow-x-auto border border-border rounded-[16px] bg-surface/30 shadow-xs">
            <table className="w-full text-left border-collapse text-xs select-none font-mono">
              <thead>
                <tr className="border-b border-border bg-surface text-muted uppercase text-[11px] tracking-[0.08em] whitespace-nowrap">
                  <th scope="col" className="py-3 px-4">
                    Model &amp; Creator
                  </th>
                  <th scope="col" className="py-3 px-3">
                    Endpoint / Quant
                  </th>
                  <th scope="col" className="py-3 px-3 text-right">
                    Input $/1M
                  </th>
                  <th scope="col" className="py-3 px-3 text-right">
                    Output $/1M
                  </th>
                  <th scope="col" className="py-3 px-3 text-right">
                    Cache Read
                  </th>
                  <th scope="col" className="py-3 px-3 text-right">
                    Context
                  </th>
                  <th scope="col" className="py-3 px-3 text-right">
                    Latency p50
                  </th>
                  <th scope="col" className="py-3 px-3 text-right">
                    Throughput
                  </th>
                  <th scope="col" className="py-3 px-4 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {provider.hostedModels.map((hm, idx) => (
                  <tr
                    key={`${hm.model.id}-${idx}`}
                    className="h-14 hover:bg-surface/80 transition-colors group cursor-default"
                  >
                    <td className="py-2.5 px-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <LabAvatar slug={hm.model.lab.slug} name={hm.model.lab.name} size="sm" />
                        <div>
                          <Link
                            href={`/models/${hm.model.slug}`}
                            className="font-medium text-text hover:underline text-xs"
                          >
                            {hm.model.name}
                          </Link>
                          <div className="text-[11px] font-mono text-muted">
                            {hm.model.lab.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-muted">
                      <span>{hm.endpointTag}</span>
                      {hm.quantization && (
                        <span className="text-subtle ml-1">({hm.quantization})</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums text-text">
                      {formatPrice(hm.inputPrice)}
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums text-text">
                      {formatPrice(hm.outputPrice)}
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums text-muted">
                      {formatPrice(hm.cacheReadPrice)}
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums text-text">
                      {formatContext(hm.contextWindow)}
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums text-muted">
                      {hm.latencyP50Ms !== null ? `${hm.latencyP50Ms}ms` : "—"}
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums text-muted">
                      {hm.throughputP50Tps !== null
                        ? `${hm.throughputP50Tps.toFixed(1)} tps`
                        : "—"}
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href={`/models/${hm.model.slug}`}
                        className="inline-flex items-center gap-1 text-muted hover:text-text font-medium"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
