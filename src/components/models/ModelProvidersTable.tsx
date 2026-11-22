// src/components/models/ModelProvidersTable.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { formatPrice, formatContext } from "@/lib/formatters";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { ModelProviderDto } from "@/types/api";

interface ModelProvidersTableProps {
  providers: ModelProviderDto[];
}

type SortField =
  | "provider"
  | "inputPrice"
  | "outputPrice"
  | "cacheReadPrice"
  | "context"
  | "latency"
  | "throughput"
  | "uptime";

export function ModelProvidersTable({ providers }: ModelProvidersTableProps) {
  const [sortField, setSortField] = React.useState<SortField>("inputPrice");
  const [sortAsc, setSortAsc] = React.useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sorted = React.useMemo(() => {
    return [...providers].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "provider":
          comparison = a.provider.name.localeCompare(b.provider.name);
          break;
        case "inputPrice":
          comparison = a.inputPrice - b.inputPrice;
          break;
        case "outputPrice":
          comparison = a.outputPrice - b.outputPrice;
          break;
        case "cacheReadPrice":
          comparison = (a.cacheReadPrice ?? Infinity) - (b.cacheReadPrice ?? Infinity);
          break;
        case "context":
          comparison = (a.contextWindow ?? 0) - (b.contextWindow ?? 0);
          break;
        case "latency":
          comparison = (a.latencyP50Ms ?? Infinity) - (b.latencyP50Ms ?? Infinity);
          break;
        case "throughput":
          comparison = (b.throughputP50Tps ?? 0) - (a.throughputP50Tps ?? 0);
          break;
        case "uptime":
          comparison = (b.uptimePct ?? 0) - (a.uptimePct ?? 0);
          break;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [providers, sortField, sortAsc]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted/40 group-hover:text-muted" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-text" />
    ) : (
      <ArrowDown className="w-3 h-3 text-text" />
    );
  };

  if (!providers || providers.length === 0) {
    return (
      <div className="py-8 text-center text-xs font-mono text-muted border border-border rounded-xl">
        No active provider endpoints found for this model.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-border rounded-[16px] bg-surface/30 shadow-xs">
      <table className="w-full text-left border-collapse text-xs select-none">
        <thead>
          <tr className="border-b border-border bg-surface text-muted font-mono uppercase text-[11px] tracking-[0.08em] whitespace-nowrap">
            <th scope="col" className="py-3 px-4 font-normal">
              <button
                type="button"
                onClick={() => handleSort("provider")}
                className="flex items-center gap-1.5 hover:text-text cursor-pointer group"
              >
                <span>Provider</span>
                {renderSortIcon("provider")}
              </button>
            </th>

            <th scope="col" className="py-3 px-3 font-normal">
              Endpoint / Quant
            </th>

            <th scope="col" className="py-3 px-3 font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("inputPrice")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>In $/1M</span>
                {renderSortIcon("inputPrice")}
              </button>
            </th>

            <th scope="col" className="py-3 px-3 font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("outputPrice")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Out $/1M</span>
                {renderSortIcon("outputPrice")}
              </button>
            </th>

            <th scope="col" className="py-3 px-3 font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("cacheReadPrice")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Cache Read</span>
                {renderSortIcon("cacheReadPrice")}
              </button>
            </th>

            <th scope="col" className="py-3 px-3 font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("context")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Context</span>
                {renderSortIcon("context")}
              </button>
            </th>

            <th scope="col" className="py-3 px-3 font-normal text-right">
              Max Output
            </th>

            <th scope="col" className="py-3 px-3 font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("latency")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Latency p50</span>
                {renderSortIcon("latency")}
              </button>
            </th>

            <th scope="col" className="py-3 px-3 font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("throughput")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Throughput</span>
                {renderSortIcon("throughput")}
              </button>
            </th>

            <th scope="col" className="py-3 px-3 font-normal text-right">
              <button
                type="button"
                onClick={() => handleSort("uptime")}
                className="inline-flex items-center gap-1 hover:text-text cursor-pointer group ml-auto"
              >
                <span>Uptime</span>
                {renderSortIcon("uptime")}
              </button>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border/60">
          {sorted.map((p) => {
            const isCheapest = p.tags.cheapest;
            const isFastest = p.tags.fastest;
            const isReliable = p.tags.mostReliable;

            return (
              <tr
                key={p.id}
                className="h-14 hover:bg-surface/80 transition-colors group cursor-default"
              >
                {/* Provider Name & Link + Tag badges */}
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/providers/${p.provider.slug}`}
                      className="font-medium text-text hover:underline text-xs"
                    >
                      {p.provider.name}
                    </Link>

                    {/* Tag badges from API */}
                    {isCheapest && (
                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded-xs bg-[#8fc49a]/15 text-[#8fc49a] border border-[#8fc49a]/30">
                        Cheapest
                      </span>
                    )}
                    {isFastest && (
                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded-xs bg-accent-warn/15 text-accent-warn border border-accent-warn/30">
                        Fastest
                      </span>
                    )}
                    {isReliable && (
                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded-xs bg-surface-raised text-text border border-border">
                        Reliable
                      </span>
                    )}
                  </div>
                </td>

                {/* Endpoint Tag / Quantization */}
                <td className="py-2.5 px-3 font-mono text-xs text-muted">
                  <span>{p.endpointTag}</span>
                  {p.quantization && (
                    <span className="text-subtle ml-1">({p.quantization})</span>
                  )}
                </td>

                {/* Input Price */}
                <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-text">
                  {formatPrice(p.inputPrice)}
                </td>

                {/* Output Price */}
                <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-text">
                  {formatPrice(p.outputPrice)}
                </td>

                {/* Cache Read */}
                <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-muted">
                  {formatPrice(p.cacheReadPrice)}
                </td>

                {/* Context Window */}
                <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-text">
                  {formatContext(p.contextWindow)}
                </td>

                {/* Max Output */}
                <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-muted">
                  {formatContext(p.maxOutputTokens)}
                </td>

                {/* Latency P50 */}
                <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-muted">
                  {p.latencyP50Ms !== null ? `${p.latencyP50Ms}ms` : "—"}
                </td>

                {/* Throughput */}
                <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-muted">
                  {p.throughputP50Tps !== null
                    ? `${p.throughputP50Tps.toFixed(1)} tps`
                    : "—"}
                </td>

                {/* Uptime */}
                <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-muted">
                  {p.uptimePct !== null ? `${p.uptimePct.toFixed(1)}%` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
