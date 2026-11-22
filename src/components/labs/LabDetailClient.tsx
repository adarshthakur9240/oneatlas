// src/components/labs/LabDetailClient.tsx
"use client";

import * as React from "react";
import { ModelTable } from "@/components/home/ModelTable";
import { ModelCard } from "@/components/home/ModelCard";
import { LayoutGrid, Table as TableIcon, Calendar } from "lucide-react";
import type { LabWithModelsDto } from "@/types/api";

interface LabDetailClientProps {
  lab: LabWithModelsDto;
}

export function LabDetailClient({ lab }: LabDetailClientProps) {
  const [view, setView] = React.useState<"table" | "cards">("table");
  const [sort, setSort] = React.useState<string>("release_desc");
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);

  // Filter models by selected timeline month if any
  const filteredModels = React.useMemo(() => {
    let list = [...lab.models];

    if (selectedMonth) {
      list = list.filter((m) => {
        if (!m.releaseDate) return selectedMonth === "Unknown";
        return m.releaseDate.slice(0, 7) === selectedMonth;
      });
    }

    list.sort((a, b) => {
      switch (sort) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "context_desc":
          return (b.contextWindow ?? 0) - (a.contextWindow ?? 0);
        case "context_asc":
          return (a.contextWindow ?? 0) - (b.contextWindow ?? 0);
        case "price_asc":
          return (a.blendedPrice ?? Infinity) - (b.blendedPrice ?? Infinity);
        case "price_desc":
          return (b.blendedPrice ?? 0) - (a.blendedPrice ?? 0);
        case "intelligence_desc":
          return (b.intelligenceScore ?? 0) - (a.intelligenceScore ?? 0);
        case "release_asc":
          return (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "");
        case "release_desc":
        default:
          return (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
      }
    });

    return list;
  }, [lab.models, selectedMonth, sort]);

  return (
    <div className="space-y-12 select-none">
      {/* Release Timeline (Grouped by Month) */}
      {lab.releaseTimeline.length > 0 && (
        <div className="bg-surface border border-border rounded-[16px] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-warn" />
              <h3 className="font-serif text-lg font-normal text-text">
                Release Timeline
              </h3>
            </div>
            {selectedMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth(null)}
                className="text-xs font-mono text-muted hover:text-text cursor-pointer"
              >
                Clear timeline filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {lab.releaseTimeline.map((item) => {
              const isSelected = selectedMonth === item.month;
              return (
                <button
                  key={item.month}
                  type="button"
                  onClick={() =>
                    setSelectedMonth(isSelected ? null : item.month)
                  }
                  className={`flex flex-col items-start px-3 py-2 rounded-xl border text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-[#e5dfd2] text-[#1b1a17] border-[#d5cfc2] font-semibold"
                      : "bg-surface-raised border-border text-muted hover:text-text hover:bg-surface"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider">
                    {item.month}
                  </span>
                  <span className="text-base font-bold tabular-nums">
                    {item.count} {item.count === 1 ? "model" : "models"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Catalog Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="font-serif text-2xl font-normal text-text">
              Models by {lab.name}
            </h3>
            <p className="text-xs text-muted font-sans mt-0.5">
              Showing {filteredModels.length} of {lab.models.length} active models
              {selectedMonth ? ` released in ${selectedMonth}` : ""}
            </p>
          </div>

          {/* Table / Cards Switcher */}
          <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-[10px]">
            <button
              type="button"
              onClick={() => setView("table")}
              className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                view === "table"
                  ? "bg-surface-raised text-text shadow-2xs"
                  : "text-muted hover:text-text"
              }`}
              aria-label="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                view === "cards"
                  ? "bg-surface-raised text-text shadow-2xs"
                  : "text-muted hover:text-text"
              }`}
              aria-label="Cards view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Catalog Render */}
        {filteredModels.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-muted border border-border rounded-xl">
            No models found for the selected timeline month.
          </div>
        ) : view === "table" ? (
          <ModelTable
            models={filteredModels}
            sort={sort}
            onSortChange={setSort}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModels.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
