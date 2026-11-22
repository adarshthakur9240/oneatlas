// src/components/home/DiscoveryToolbar.tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Search, X } from "lucide-react";
import type { useModelQuery } from "@/hooks/useModelQuery";
import type { FilterFacetsDto } from "@/types/api";

interface DiscoveryToolbarProps {
  query: ReturnType<typeof useModelQuery>;
  facets: FilterFacetsDto;
  totalModels: number;
}

export function DiscoveryToolbar({
  query,
  facets,
  totalModels,
}: DiscoveryToolbarProps) {
  const { state } = query;
  const [prevQ, setPrevQ] = React.useState(state.q);
  const [searchInput, setSearchInput] = React.useState(state.q);
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Sync state if URL changed externally
  if (prevQ !== state.q) {
    setPrevQ(state.q);
    setSearchInput(state.q);
  }

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      query.setSearch(val);
    }, 250);
  };

  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3.5 mb-6">
      {/* Top Toolbar Row */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0 sm:min-w-[280px]">
          <div className="w-full sm:w-64">
            <Input
              icon={<Search className="w-4 h-4" aria-hidden="true" />}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={`Search ${facets.totalListableModels} models...`}
              aria-label="Search models"
            />
          </div>

          {/* Lab Select */}
          <Select
            value={state.lab[0] || ""}
            onChange={(e) => query.setSingleLab(e.target.value)}
            aria-label="Filter by lab"
          >
            <option value="">All labs ({facets.labs.length})</option>
            {facets.labs.map((lab) => (
              <option key={lab.slug} value={lab.slug}>
                {lab.name} ({lab.count})
              </option>
            ))}
          </Select>

          {/* Provider Select */}
          <Select
            value={state.provider[0] || ""}
            onChange={(e) => query.setSingleProvider(e.target.value)}
            aria-label="Filter by inference provider"
          >
            <option value="">Any provider ({facets.providers.length})</option>
            {facets.providers.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p.count})
              </option>
            ))}
          </Select>

          {/* Type Select */}
          <Select
            value={state.type[0] || ""}
            onChange={(e) => query.setSingleType(e.target.value)}
            aria-label="Filter by model type"
          >
            <option value="">All types</option>
            {facets.types.map((t) => (
              <option key={t.type} value={t.type}>
                {t.type} ({t.count})
              </option>
            ))}
          </Select>
        </div>

        {/* Right: Results Count & Segmented Control */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Cards View Sort Dropdown (Visible only in cards view) */}
          {state.view === "cards" && (
            <Select
              value={state.sort}
              onChange={(e) => query.setSort(e.target.value)}
              aria-label="Sort models"
              className="w-36"
            >
              <option value="release_desc">Latest release</option>
              <option value="release_asc">Oldest release</option>
              <option value="composite_desc">Composite score</option>
              <option value="intelligence_desc">Intelligence</option>
              <option value="coding_desc">Coding score</option>
              <option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option>
              <option value="context_desc">Context: Largest</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="providers_desc">Most providers</option>
            </Select>
          )}

          <div
            className="text-xs font-mono text-muted tabular-nums hidden sm:block"
            aria-live="polite"
          >
            <span className="font-semibold text-text">{totalModels}</span>{" "}
            {totalModels === 1 ? "model" : "models"}
          </div>

          <SegmentedControl value={state.view} onChange={query.setView} />
        </div>
      </div>

      {/* Pill Filters Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        <Chip
          active={state.capability.includes("reasoning")}
          onClick={() => query.toggleCapability("reasoning")}
        >
          Reasoning
        </Chip>

        <Chip
          active={state.capability.includes("tool_calling")}
          onClick={() => query.toggleCapability("tool_calling")}
        >
          Tool calling
        </Chip>

        <Chip
          active={state.capability.includes("structured_outputs")}
          onClick={() => query.toggleCapability("structured_outputs")}
        >
          Structured output
        </Chip>

        <Chip
          active={state.capability.includes("vision")}
          onClick={() => query.toggleCapability("vision")}
        >
          Vision
        </Chip>

        <Chip
          active={state.openWeights === true}
          onClick={query.toggleOpenWeights}
          count={facets.openWeightsCount}
        >
          Open weights
        </Chip>

        <Chip
          active={state.minContext === 1000000}
          onClick={query.toggleMinContext1M}
          count={facets.contextBuckets.gte1m}
        >
          1M+ context
        </Chip>

        <Chip
          active={state.free === true}
          onClick={query.toggleFree}
          count={facets.freeCount}
        >
          Free
        </Chip>

        <div className="h-4 w-px bg-border shrink-0 mx-1" aria-hidden="true" />

        <Chip
          active={state.hideDeprecated}
          onClick={query.toggleHideDeprecated}
          className={state.hideDeprecated ? "bg-surface-raised text-text border-border-strong font-medium" : ""}
        >
          Hide deprecated
        </Chip>

        {query.hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={query.clearFilters}
            className="text-xs text-muted hover:text-text gap-1 shrink-0 ml-1"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear filters</span>
          </Button>
        )}
      </div>
    </div>
  );
}
