// src/components/home/ModelTable.tsx
"use client";

import Link from "next/link";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatContext, displayName } from "@/lib/formatters";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { useCompare } from "@/lib/compare-store";
import { Check, Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { ModelSummaryDto } from "@/types/api";

interface ModelTableProps {
  models: ModelSummaryDto[];
  sort: string;
  onSortChange: (sort: string) => void;
  isLoading?: boolean;
}

export function ModelTable({
  models,
  sort,
  onSortChange,
  isLoading,
}: ModelTableProps) {
  const { has, toggle } = useCompare();

  const handleSort = (field: string) => {
    if (field === "name") {
      onSortChange(sort === "name_asc" ? "release_desc" : "name_asc");
    } else if (field === "providers") {
      onSortChange(sort === "providers_desc" ? "release_desc" : "providers_desc");
    } else if (field === "context") {
      onSortChange(sort === "context_desc" ? "context_asc" : "context_desc");
    } else if (field === "price") {
      onSortChange(sort === "price_asc" ? "price_desc" : "price_asc");
    } else if (field === "intelligence") {
      onSortChange(sort === "intelligence_desc" ? "release_desc" : "intelligence_desc");
    } else if (field === "release") {
      onSortChange(sort === "release_desc" ? "release_asc" : "release_desc");
    }
  };

  const getSortIcon = (descKey: string, ascKey?: string) => {
    if (sort === descKey) return <ArrowDown className="w-3 h-3 text-text" />;
    if (ascKey && sort === ascKey) return <ArrowUp className="w-3 h-3 text-text" />;
    return <ArrowUpDown className="w-3 h-3 text-muted/40 group-hover:text-muted" />;
  };

  return (
    <div
      className={`w-full overflow-x-auto border border-border rounded-[16px] bg-surface/30 shadow-xs transition-opacity duration-150 ${
        isLoading ? "opacity-60" : "opacity-100"
      }`}
    >
      <table className="w-full text-left border-collapse text-xs select-none">
        {/* Sticky Table Header */}
        <thead>
          <tr className="border-b border-border bg-surface text-muted font-mono uppercase text-[10.5px] tracking-[0.08em] whitespace-nowrap h-10">
            <th scope="col" className="py-2 px-3 w-[240px] max-w-[260px] font-normal sticky left-0 bg-surface z-10 shadow-xs">
              <button
                type="button"
                onClick={() => handleSort("name")}
                className="flex items-center gap-1.5 hover:text-text cursor-pointer group"
              >
                <span>Model</span>
                {getSortIcon("name_asc")}
              </button>
            </th>

            <th scope="col" className="py-2.5 px-2 w-[72px] font-normal text-center">
              <button
                type="button"
                onClick={() => handleSort("providers")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group mx-auto"
              >
                <span>Providers</span>
                {getSortIcon("providers_desc")}
              </button>
            </th>

            <th scope="col" className="py-2.5 px-2 w-[68px] font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("context")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Context</span>
                {getSortIcon("context_desc", "context_asc")}
              </button>
            </th>

            <th scope="col" className="py-2.5 px-2 w-[64px] font-normal text-right">
              Output
            </th>

            <th scope="col" className="py-2.5 px-2 w-[72px] font-normal text-center">
              Modalities
            </th>

            <th scope="col" className="py-2.5 px-1 w-[46px] font-normal text-center" title="Reasoning token support">
              Reasoning
            </th>

            <th scope="col" className="py-2.5 px-1 w-[46px] font-normal text-center" title="Function & tool calling">
              Tools
            </th>

            <th scope="col" className="py-2.5 px-1 w-[46px] font-normal text-center" title="Structured JSON output">
              JSON
            </th>

            <th scope="col" className="py-2.5 px-1 w-[46px] font-normal text-center" title="Temperature parameter support">
              Temp
            </th>

            <th scope="col" className="py-2.5 px-2 w-[64px] font-normal text-center">
              Weights
            </th>

            <th scope="col" className="py-2.5 px-2 w-[112px] font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("price")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Price / 1M</span>
                {getSortIcon("price_asc", "price_desc")}
              </button>
            </th>

            <th scope="col" className="py-2.5 px-2 w-[76px] font-normal text-right">
              Cache Read
            </th>

            <th scope="col" className="py-2.5 px-2 w-[60px] font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("intelligence")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Intel.</span>
                {getSortIcon("intelligence_desc")}
              </button>
            </th>

            <th scope="col" className="py-2.5 px-2 w-[76px] font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("release")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Released</span>
                {getSortIcon("release_desc", "release_asc")}
              </button>
            </th>

            <th scope="col" className="py-2.5 px-2 w-[44px] font-normal text-center">
              <span className="sr-only">Compare</span>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-border/60">
          {models.map((m) => {
            const inCompare = has(m.slug);
            const hasReasoning = m.capabilities.includes("reasoning");
            const hasTools = m.capabilities.includes("tool_calling");
            const hasJson = m.capabilities.includes("structured_outputs");
            const hasTemp = m.capabilities.includes("temperature");

            // Format sourceId tail (e.g. "anthropic/claude-sonnet-4" -> "claude-sonnet-4")
            const sourceTail = m.sourceId.includes("/")
              ? m.sourceId.split("/")[1]
              : m.slug;

            // Format release date e.g. "Nov 2024"
            let relStr = "—";
            if (m.releaseDate) {
              const d = new Date(m.releaseDate);
              relStr = d.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              });
            }

            return (
              <tr
                key={m.id}
                className="h-[52px] hover:bg-surface-raised/40 transition-colors group cursor-default"
              >
                {/* MODEL CELL (Sticky left column) */}
                <td className="py-1.5 px-3 w-[240px] max-w-[260px] sticky left-0 bg-background group-hover:bg-[#1f1f1d] z-10 shadow-xs transition-colors">
                  <div className="flex items-center gap-2.5">
                    <LabAvatar slug={m.lab.slug} name={m.lab.name} size="md" />
                    <div className="flex flex-col min-w-0 max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/models/${m.slug}`}
                          title={m.name}
                          className="font-medium text-text hover:underline truncate group-hover:text-white"
                        >
                          {displayName(m)}
                        </Link>
                        {m.isNew && <Badge variant="new">NEW</Badge>}
                      </div>
                      <span className="text-[11px] font-mono text-muted truncate">
                        {m.lab.name} · {sourceTail}
                      </span>
                    </div>
                  </div>
                </td>

                {/* PROVIDERS */}
                <td className="py-2 px-2 text-center">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-surface-raised border border-border text-muted tabular-nums">
                    {m.providerCount}
                  </span>
                </td>

                {/* CONTEXT */}
                <td className="py-2 px-2 text-right font-mono text-xs tabular-nums text-text">
                  {formatContext(m.contextWindow)}
                </td>

                {/* OUTPUT */}
                <td className="py-2 px-2 text-right font-mono text-xs tabular-nums text-muted">
                  {formatContext(m.maxOutputTokens)}
                </td>

                {/* MODALITIES */}
                <td className="py-2 px-2 text-center">
                  <span className="inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] bg-surface-raised text-muted rounded-sm border border-border">
                    {m.inputModalities.includes("image") ? "T,I" : "T"} →{" "}
                    {m.outputModalities.includes("embedding") ? "Emb" : "T"}
                  </span>
                </td>

                {/* REASONING */}
                <td className="py-2 px-1 text-center">
                  {hasReasoning ? (
                    <Check className="w-3.5 h-3.5 text-[#8fc49a] mx-auto" aria-label="Yes" />
                  ) : (
                    <span className="text-muted/40 font-mono">—</span>
                  )}
                </td>

                {/* TOOLS */}
                <td className="py-2 px-1 text-center">
                  {hasTools ? (
                    <Check className="w-3.5 h-3.5 text-[#8fc49a] mx-auto" aria-label="Yes" />
                  ) : (
                    <span className="text-muted/40 font-mono">—</span>
                  )}
                </td>

                {/* JSON */}
                <td className="py-2 px-1 text-center">
                  {hasJson ? (
                    <Check className="w-3.5 h-3.5 text-[#8fc49a] mx-auto" aria-label="Yes" />
                  ) : (
                    <span className="text-muted/40 font-mono">—</span>
                  )}
                </td>

                {/* TEMP */}
                <td className="py-2 px-1 text-center">
                  {hasTemp ? (
                    <Check className="w-3.5 h-3.5 text-[#8fc49a] mx-auto" aria-label="Yes" />
                  ) : (
                    <span className="text-muted/40 font-mono">—</span>
                  )}
                </td>

                {/* WEIGHTS */}
                <td className="py-2 px-2 text-center">
                  {m.isOpenWeights ? (
                    <Badge variant="open">Open</Badge>
                  ) : (
                    <span className="text-subtle font-mono text-[11px]">Closed</span>
                  )}
                </td>

                {/* PRICE / 1M */}
                <td className="py-2 px-2 text-right font-mono text-xs tabular-nums">
                  {m.minInputPrice === 0 && m.minOutputPrice === 0 ? (
                    <span className="text-[#8fc49a] font-semibold">Free</span>
                  ) : m.minInputPrice !== null && m.minOutputPrice !== null ? (
                    <span className="text-text">
                      {formatPrice(m.minInputPrice)} / {formatPrice(m.minOutputPrice)}
                    </span>
                  ) : (
                    <span className="text-muted/50">—</span>
                  )}
                </td>

                {/* CACHE READ */}
                <td className="py-2 px-2 text-right font-mono text-xs tabular-nums text-muted">
                  {formatPrice(m.minCacheReadPrice)}
                </td>

                {/* INTELLIGENCE SCORE */}
                <td className="py-2 px-2 text-right font-mono text-xs tabular-nums">
                  <ScoreDisplay
                    score={m.intelligenceScore}
                    scoreBasis={m.scoreBasis}
                    className="font-medium text-text justify-end"
                  />
                </td>

                {/* RELEASED */}
                <td className="py-2 px-2 text-right font-mono text-xs text-muted whitespace-nowrap">
                  {relStr}
                </td>

                {/* COMPARE ACTION */}
                <td className="py-2 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => toggle(m.slug)}
                    aria-label={
                      inCompare
                        ? `Remove ${m.name} from compare`
                        : `Add ${m.name} to compare`
                    }
                    className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer ${
                      inCompare
                        ? "bg-[#e5dfd2] text-[#1b1a17] font-bold shadow-xs"
                        : "text-muted hover:text-text hover:bg-surface-raised border border-border"
                    }`}
                  >
                    {inCompare ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
