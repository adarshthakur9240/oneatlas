// src/app/labs/[slug]/page.tsx
// Server Component for Lab Profile View

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLabBySlug } from "@/server/services/labs";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { LabDetailClient } from "@/components/labs/LabDetailClient";
import { NotFoundError } from "@/lib/api-response";
import { Globe } from "lucide-react";

import { getBaseUrl } from "@/lib/url";

interface LabPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: LabPageProps): Promise<Metadata> {
  const { slug } = await params;
  let lab;
  try {
    lab = await getLabBySlug(slug);
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }

  const title = `${lab.name} AI Models & Releases | OneAtlas`;
  const description = `Explore ${lab.name}'s AI model portfolio (${lab.models.length} models), release timeline, open-weights, and pricing benchmarks on OneAtlas.`;
  const canonicalUrl = `${getBaseUrl()}/labs/${lab.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
  };
}

export default async function LabPage({ params }: LabPageProps) {
  const { slug } = await params;

  let lab;
  try {
    lab = await getLabBySlug(slug);
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }

  const openWeightsCount = lab.models.filter((m) => m.isOpenWeights).length;

  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Lab Header */}
        <div className="pb-8 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-5 min-w-0">
              <LabAvatar slug={lab.slug} name={lab.name} size="lg" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text tracking-tight">
                    {lab.name}
                  </h1>
                  {lab.isOpenFirst && <Badge variant="open">Open-First</Badge>}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted mb-3">
                  {lab.country && <span>Based in {lab.country}</span>}
                  {lab.foundedYear && <span>· Founded in {lab.foundedYear}</span>}
                  {lab.website && (
                    <a
                      href={lab.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-text hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{new URL(lab.website).hostname}</span>
                    </a>
                  )}
                </div>

                {lab.description && (
                  <p className="text-sm text-muted font-sans max-w-3xl leading-relaxed">
                    {lab.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile
            label="Total Models"
            value={lab.models.length}
            subtext="Listable architectures"
          />
          <StatTile
            label="Open Weights"
            value={openWeightsCount}
            subtext={`${Math.round((openWeightsCount / (lab.models.length || 1)) * 100)}% of portfolio`}
          />
          <StatTile
            label="Release Months"
            value={lab.releaseTimeline.length}
            subtext="Active shipping periods"
          />
          <StatTile
            label="Latest Release"
            value={
              lab.releaseTimeline[0]?.month
                ? lab.releaseTimeline[0].month
                : "—"
            }
            subtext="Most recent deployment"
          />
        </div>

        {/* Lab Detail Interactive Client */}
        <LabDetailClient lab={lab} />
      </div>
    </div>
  );
}
