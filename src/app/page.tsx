// src/app/page.tsx
// Server Component: fetches initial data directly via domain services for fast SEO-friendly SSR

import { Suspense } from "react";
import { getStats } from "@/server/services/stats";
import { getFilterFacets } from "@/server/services/filters";
import { listModels } from "@/server/services/models";
import { ModelsQuerySchema } from "@/lib/validators";
import { HomeClient } from "@/components/home/HomeClient";

export const instant = false;

export default async function HomePage() {
  const [stats, facets, modelsResult] = await Promise.all([
    getStats(),
    getFilterFacets(),
    listModels(
      ModelsQuerySchema.parse({
        page: 1,
        limit: 18,
        hideDeprecated: true,
        sort: "release_desc",
      })
    ),
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeClient
        initialStats={stats}
        initialFacets={facets}
        initialModels={modelsResult.models}
        initialMeta={modelsResult.meta}
      />
    </Suspense>
  );
}
