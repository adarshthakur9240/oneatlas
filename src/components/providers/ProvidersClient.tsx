// src/components/providers/ProvidersClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/formatters";
import { Search, ArrowRight, Layers } from "lucide-react";
import type { ProviderListItemDto } from "@/types/api";

interface ProvidersClientProps {
  initialProviders: ProviderListItemDto[];
}

export function ProvidersClient({ initialProviders }: ProvidersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort") || "models_desc";

  const [query, setQuery] = React.useState(searchQuery);

  const updateUrl = (newQuery: string, newSort: string) => {
    const p = new URLSearchParams();
    if (newQuery.trim()) p.set("q", newQuery.trim());
    if (newSort !== "models_desc") p.set("sort", newSort);
    router.push(`/providers?${p.toString()}`);
  };

  const handleSearchChange = (val: string) => {
    setQuery(val);
    updateUrl(val, sortParam);
  };

  const handleSortChange = (newSort: string) => {
    updateUrl(query, newSort);
  };

  const filtered = React.useMemo(() => {
    let list = [...initialProviders];

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortParam) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "price_asc":
          return (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity);
        case "latency_asc":
          return (a.avgLatencyMs ?? Infinity) - (b.avgLatencyMs ?? Infinity);
        case "throughput_desc":
          return (b.avgThroughputTps ?? 0) - (a.avgThroughputTps ?? 0);
        case "uptime_desc":
          return (b.uptimePct ?? 0) - (a.uptimePct ?? 0);
        case "cheapest_desc":
          return b.cheapestCount - a.cheapestCount;
        case "models_desc":
        default:
          return b.hostedModelCount - a.hostedModelCount;
      }
    });

    return list;
  }, [initialProviders, query, sortParam]);

  return (
    <div className="space-y-8 select-none">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search inference hosts & providers..."
            aria-label="Search inference hosts & providers"
            className="w-full pl-9 pr-4 py-2 bg-surface text-text placeholder:text-muted/60 text-xs font-mono border border-border rounded-[10px] outline-none focus:border-border-strong"
          />
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto text-xs font-mono">
          <span className="text-muted tabular-nums" aria-live="polite">
            <span className="text-text font-bold">{filtered.length}</span> {filtered.length === 1 ? "provider" : "providers"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted uppercase tracking-wider text-[11px]">Sort:</span>
            <select
              value={sortParam}
              onChange={(e) => handleSortChange(e.target.value)}
              aria-label="Sort providers"
              className="bg-surface text-text border border-border rounded-[8px] px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="models_desc">Most Hosted Models</option>
              <option value="price_asc">Lowest Starting Price</option>
              <option value="throughput_desc">Highest Throughput</option>
              <option value="latency_asc">Lowest Latency</option>
              <option value="uptime_desc">Highest Uptime</option>
              <option value="cheapest_desc">Most Best-Price Endpoints</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Providers Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-border border-dashed rounded-[16px] bg-surface/30">
          <Layers className="w-8 h-8 text-muted/40 mx-auto mb-2" />
          <div className="text-sm font-medium text-text mb-1">No providers found</div>
          <div className="text-xs text-muted font-sans">
            No inference providers matched your query &quot;{query}&quot;.
          </div>
        </div>
      ) : (
        <div className="w-full overflow-x-auto border border-border rounded-[16px] bg-surface/30 shadow-xs">
          <table className="w-full text-left border-collapse text-xs select-none font-mono">
            <thead>
              <tr className="border-b border-border bg-surface text-muted uppercase text-[11px] tracking-[0.08em] whitespace-nowrap">
                <th scope="col" className="py-3 px-4">
                  Provider
                </th>
                <th scope="col" className="py-3 px-3 text-center">
                  Hosted Models
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  Starting Blended $/1M
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  Avg Latency
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  Avg Throughput
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  Avg Uptime
                </th>
                <th scope="col" className="py-3 px-3 text-center">
                  Cheapest Host Count
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="h-14 hover:bg-surface/80 transition-colors group cursor-default"
                >
                  {/* Name */}
                  <td className="py-2.5 px-4 font-sans">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-md bg-surface-raised border border-border flex items-center justify-center font-mono text-[10px] text-muted font-bold">
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <Link
                          href={`/providers/${p.slug}`}
                          className="font-medium text-text hover:underline text-xs"
                        >
                          {p.name}
                        </Link>
                      </div>
                    </div>
                  </td>

                  {/* Hosted Models */}
                  <td className="py-2.5 px-3 text-center tabular-nums">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-surface-raised border border-border text-muted">
                      {p.hostedModelCount}
                    </span>
                  </td>

                  {/* Starting Price */}
                  <td className="py-2.5 px-3 text-right tabular-nums text-text font-medium">
                    {p.startingPrice !== null ? formatPrice(p.startingPrice) : "—"}
                  </td>

                  {/* Avg Latency */}
                  <td className="py-2.5 px-3 text-right tabular-nums text-muted">
                    {p.avgLatencyMs !== null ? `${p.avgLatencyMs}ms` : "—"}
                  </td>

                  {/* Avg Throughput */}
                  <td className="py-2.5 px-3 text-right tabular-nums text-muted">
                    {p.avgThroughputTps !== null
                      ? `${p.avgThroughputTps.toFixed(1)} tps`
                      : "—"}
                  </td>

                  {/* Avg Uptime */}
                  <td className="py-2.5 px-3 text-right tabular-nums text-muted">
                    {p.uptimePct !== null ? `${p.uptimePct.toFixed(1)}%` : "—"}
                  </td>

                  {/* Cheapest Host Count */}
                  <td className="py-2.5 px-3 text-center tabular-nums">
                    {p.cheapestCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#8fc49a]/15 text-[#8fc49a] border border-[#8fc49a]/30 font-bold">
                        {p.cheapestCount} models
                      </span>
                    ) : (
                      <span className="text-muted/40">—</span>
                    )}
                  </td>

                  {/* Link */}
                  <td className="py-2.5 px-4 text-right">
                    <Link
                      href={`/providers/${p.slug}`}
                      className="inline-flex items-center gap-1 text-muted hover:text-text font-medium"
                    >
                      <span>Endpoints</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
