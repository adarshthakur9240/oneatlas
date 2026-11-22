// src/app/models/[slug]/page.tsx
// Server Component for Model Detail View

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getModelBySlug } from "@/server/services/models";
import { displayName, formatPrice, formatContext } from "@/lib/formatters";
import { ModelHeader } from "@/components/models/ModelHeader";
import { ModelKpiStrip } from "@/components/models/ModelKpiStrip";
import { ModelOverview } from "@/components/models/ModelOverview";
import { ModelProvidersTable } from "@/components/models/ModelProvidersTable";
import { ModelCostCalculator } from "@/components/models/ModelCostCalculator";
import { ModelBenchmarks } from "@/components/models/ModelBenchmarks";
import { ModelQuickstart } from "@/components/models/ModelQuickstart";
import { ModelRelated } from "@/components/models/ModelRelated";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { NotFoundError } from "@/lib/api-response";

interface ModelPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ModelPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const model = await getModelBySlug(slug);
    const titleName = displayName(model);
    const labName = model.lab.name;
    const priceText =
      model.minInputPrice !== null && model.minOutputPrice !== null
        ? `${formatPrice(model.minInputPrice)}/${formatPrice(model.minOutputPrice)} per 1M`
        : "Unpriced";

    const title = `${titleName} by ${labName} — Specs, Pricing & Benchmarks | OneAtlas`;
    const description = `Compare ${titleName} (${labName}) inference endpoints across ${model.providerCount} providers. Pricing: ${priceText}, Context: ${formatContext(model.contextWindow)}. Benchmarks, latency & quickstart snippets.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Model Not Found | OneAtlas",
      description: "The requested AI model was not found in the OneAtlas catalog.",
    };
  }
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { slug } = await params;

  let model;
  try {
    model = await getModelBySlug(slug);
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }

  const modelTitle = displayName(model);

  return (
    <div className="w-full min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* 1. Header with Avatar, Title, Source ID copy, Badges & Actions */}
        <ModelHeader model={model} />

        {/* 2. KPI Strip: 5 Mono Stat Tiles */}
        <ModelKpiStrip model={model} />

        {/* 3. Overview & Specifications */}
        <ModelOverview model={model} />

        {/* 4. Providers & Endpoints Table */}
        <div className="space-y-4">
          <SectionHeader
            title="Inference Providers & Endpoints"
            subtitle={`Compare latency, throughput, uptime, and pricing across all active hosts for ${modelTitle}.`}
            count={model.providers.length}
          />
          <ModelProvidersTable providers={model.providers} />
        </div>

        {/* 5. Interactive Cost Calculator */}
        <ModelCostCalculator
          providers={model.providers}
          modelName={modelTitle}
        />

        {/* 6. Cited Benchmarks & Evaluations */}
        <div className="space-y-4">
          <SectionHeader
            title="Empirical Benchmarks"
            subtitle="Verified scores and category leader comparisons with reproducible methodology citations."
            count={model.benchmarks.length}
          />
          <ModelBenchmarks
            benchmarks={model.benchmarks}
          />
        </div>

        {/* 7. Developer Quickstart Snippets */}
        <ModelQuickstart
          sourceId={model.sourceId}
          modelName={modelTitle}
        />

        {/* 8. Related Models Row */}
        <ModelRelated
          related={model.related}
        />
      </div>
    </div>
  );
}
