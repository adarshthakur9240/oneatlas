// src/components/labs/LabsClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { Badge } from "@/components/ui/Badge";
import { displayName, formatDate, formatScore } from "@/lib/formatters";
import { Search, ArrowRight, Cpu } from "lucide-react";
import type { LabListItemDto } from "@/types/api";

interface LabsClientProps {
  initialLabs: LabListItemDto[];
}

export function LabsClient({ initialLabs }: LabsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort") || "models_desc";

  const [query, setQuery] = React.useState(searchQuery);

  const updateUrl = (newQuery: string, newSort: string) => {
    const p = new URLSearchParams();
    if (newQuery.trim()) p.set("q", newQuery.trim());
    if (newSort !== "models_desc") p.set("sort", newSort);
    router.push(`/labs?${p.toString()}`);
  };

  const handleSearchChange = (val: string) => {
    setQuery(val);
    updateUrl(val, sortParam);
  };

  const handleSortChange = (newSort: string) => {
    updateUrl(query, newSort);
  };

  // Filter & Sort
  const filtered = React.useMemo(() => {
    let list = [...initialLabs];

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.slug.toLowerCase().includes(q) ||
          (l.country && l.country.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      switch (sortParam) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "models_asc":
          return a.modelCount - b.modelCount;
        case "open_desc":
          return b.openWeightsCount - a.openWeightsCount;
        case "score_desc":
          return (b.avgCompositeScore ?? 0) - (a.avgCompositeScore ?? 0);
        case "models_desc":
        default:
          return b.modelCount - a.modelCount;
      }
    });

    return list;
  }, [initialLabs, query, sortParam]);

  return (
    <div className="space-y-8 select-none">
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search AI labs by name or country..."
            aria-label="Search AI labs by name or country"
            className="w-full pl-9 pr-4 py-2 bg-surface text-text placeholder:text-muted/60 text-xs font-mono border border-border rounded-[10px] outline-none focus:border-border-strong"
          />
        </div>

        {/* Count & Sort Select */}
        <div className="flex items-center gap-4 self-end sm:self-auto text-xs font-mono">
          <span className="text-muted tabular-nums" aria-live="polite">
            <span className="text-text font-bold">{filtered.length}</span> {filtered.length === 1 ? "lab" : "labs"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted uppercase tracking-wider text-[11px]">Sort:</span>
            <select
              value={sortParam}
              onChange={(e) => handleSortChange(e.target.value)}
              aria-label="Sort labs"
              className="bg-surface text-text border border-border rounded-[8px] px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="models_desc">Most Models</option>
              <option value="models_asc">Fewest Models</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="open_desc">Most Open Weights</option>
              <option value="score_desc">Highest Avg Intelligence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Labs Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-border border-dashed rounded-[16px] bg-surface/30">
          <Cpu className="w-8 h-8 text-muted/40 mx-auto mb-2" />
          <div className="text-sm font-medium text-text mb-1">No AI labs found</div>
          <div className="text-xs text-muted font-sans">
            No research organizations matched your query &quot;{query}&quot;.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((lab) => (
            <div
              key={lab.id}
              className="bg-surface border border-border rounded-[16px] p-5 flex flex-col justify-between space-y-4 hover:border-border-strong transition-colors shadow-xs group"
            >
              <div className="space-y-3">
                {/* Lab Top Row: Avatar & Name */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <LabAvatar slug={lab.slug} name={lab.name} size="md" />
                    <div className="truncate">
                      <Link
                        href={`/labs/${lab.slug}`}
                        className="font-serif text-lg font-normal text-text hover:underline truncate block group-hover:text-white"
                      >
                        {lab.name}
                      </Link>
                      <div className="text-[11px] font-mono text-muted flex items-center gap-1.5">
                        {lab.country && <span>{lab.country}</span>}
                        {lab.foundedYear && <span>· Est. {lab.foundedYear}</span>}
                      </div>
                    </div>
                  </div>

                  {lab.isOpenFirst && (
                    <Badge variant="open">Open-First</Badge>
                  )}
                </div>

                {/* Description snippet */}
                {lab.description && (
                  <p className="text-xs text-muted font-sans line-clamp-2 leading-relaxed">
                    {lab.description}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-border/60 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-muted uppercase">Models</div>
                    <div className="text-sm font-bold text-text tabular-nums mt-0.5">
                      {lab.modelCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase">Open Wts</div>
                    <div className="text-sm font-bold text-text tabular-nums mt-0.5">
                      {lab.openWeightsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase">Avg Intel</div>
                    <div className="text-sm font-bold text-text tabular-nums mt-0.5">
                      {formatScore(lab.avgCompositeScore)}
                    </div>
                  </div>
                </div>

                {/* Flagship Model */}
                {lab.flagship && (
                  <div className="text-xs font-mono space-y-1">
                    <span className="text-[10px] uppercase text-subtle">Flagship</span>
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/models/${lab.flagship.slug}`}
                        className="text-text hover:underline truncate max-w-[170px] font-medium"
                      >
                        {displayName(lab.flagship)}
                      </Link>
                      {lab.flagship.compositeScore !== null && (
                        <span className="text-[#8fc49a] font-bold tabular-nums">
                          {formatScore(lab.flagship.compositeScore)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] text-subtle">
                  {lab.latestRelease ? `Updated ${formatDate(lab.latestRelease)}` : "—"}
                </span>
                <Link
                  href={`/labs/${lab.slug}`}
                  className="inline-flex items-center gap-1 font-medium text-muted hover:text-text"
                >
                  <span>Explore models</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
