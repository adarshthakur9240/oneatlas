// src/components/home/HomeClient.tsx
"use client";

import useSWR from "swr";
import { useModelQuery } from "@/hooks/useModelQuery";
import { HeroSection } from "./HeroSection";
import { DiscoveryToolbar } from "./DiscoveryToolbar";
import { ModelTable } from "./ModelTable";
import { ModelCard } from "./ModelCard";
import { Pagination } from "./Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";
import type {
  StatsDto,
  FilterFacetsDto,
  ModelSummaryDto,
  PaginationMeta,
  ApiSuccessResponse,
} from "@/types/api";

interface HomeClientProps {
  initialStats: StatsDto;
  initialFacets: FilterFacetsDto;
  initialModels: ModelSummaryDto[];
  initialMeta: PaginationMeta;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
};

export function HomeClient({
  initialStats,
  initialFacets,
  initialModels,
  initialMeta,
}: HomeClientProps) {
  const query = useModelQuery();
  const { state, apiQueryString, hasActiveFilters } = query;

  // Check if current state matches initial SSR state
  const isDefaultQuery =
    !hasActiveFilters &&
    state.sort === "release_desc" &&
    state.page === 1;

  const { data, error, isValidating, mutate } = useSWR<
    ApiSuccessResponse<ModelSummaryDto[]>
  >(`/api/models?${apiQueryString}`, fetcher, {
    fallbackData: isDefaultQuery
      ? { success: true, data: initialModels, meta: initialMeta }
      : undefined,
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const models = data?.data ?? (isDefaultQuery ? initialModels : []);
  const meta: PaginationMeta = (data?.meta as PaginationMeta) ?? initialMeta;
  const totalModels = meta?.total ?? models.length;

  return (
    <div className="w-full flex flex-col">
      {/* 1. Hero Section with Stats Bento */}
      <HeroSection stats={initialStats} />

      {/* 2. Discovery Section */}
      <section
        id="catalog-section"
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20"
      >
        <DiscoveryToolbar
          query={query}
          facets={initialFacets}
          totalModels={totalModels}
        />

        {/* Inline Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center p-8 bg-surface-raised border border-accent-danger/30 rounded-[16px] text-center my-6">
            <AlertCircle className="w-6 h-6 text-accent-danger mb-2" />
            <h4 className="text-sm font-medium text-text mb-1">
              Unable to load model catalog
            </h4>
            <p className="text-xs text-muted mb-4 max-w-sm">
              An error occurred while fetching models from the database.
            </p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Try again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!error && models.length === 0 && (
          <EmptyState
            title="No models match your filters"
            description="Try removing capability tags, clearing search keywords, or enabling unserved models."
            onClear={query.clearFilters}
          />
        )}

        {/* Table View */}
        {!error && models.length > 0 && state.view === "table" && (
          <ModelTable
            models={models}
            sort={state.sort}
            onSortChange={query.setSort}
            isLoading={isValidating}
          />
        )}

        {/* Cards View */}
        {!error && models.length > 0 && state.view === "cards" && (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 transition-opacity duration-150 ${
              isValidating ? "opacity-60" : "opacity-100"
            }`}
          >
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!error && (
          <Pagination
            page={state.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={state.limit}
            onPageChange={query.setPage}
          />
        )}
      </section>
    </div>
  );
}
