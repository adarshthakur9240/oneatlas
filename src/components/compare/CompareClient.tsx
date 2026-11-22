// src/components/compare/CompareClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { displayName, formatPrice, formatContext, formatScore } from "@/lib/formatters";
import { estimateMonthlyCost } from "@/lib/cost";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { CompareModelPicker } from "./CompareModelPicker";
import { BenchmarkBarChart, BenchmarkBarDataPoint } from "@/components/charts/BenchmarkBarChart";
import { RadarMetricsChart, RadarDataPoint } from "@/components/charts/RadarMetricsChart";
import {
  X,
  Plus,
  Sparkles,
  Check,
  Calculator,
  SlidersHorizontal,
} from "lucide-react";
import type {
  CompareResultDto,
  ComparePresetDto,
  ModelDetailDto,
} from "@/types/api";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const MODEL_COLORS = ["#e5dfd2", "#8fc49a", "#d9a441", "#8ab4f8"];

export function CompareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read slugs from URL parameter: ?models=slug1,slug2,...
  const modelsParam = searchParams.get("models");
  const urlSlugs = React.useMemo(() => {
    if (!modelsParam) return [];
    return modelsParam.split(",").map((s) => s.trim()).filter(Boolean);
  }, [modelsParam]);

  const activeSlugs = urlSlugs;
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [replaceIndex, setReplaceIndex] = React.useState<number | null>(null);

  // Fetch presets
  const { data: presetsData } = useSWR<{ success: boolean; data: ComparePresetDto[] }>(
    "/api/compare/presets",
    fetcher
  );

  // Fetch comparison data if at least 2 models
  const compareQuery = activeSlugs.join(",");
  const shouldFetch = activeSlugs.length >= 2;
  const {
    data: compareData,
    isLoading: compareLoading,
  } = useSWR<{ success: boolean; data: CompareResultDto; error?: { message: string } }>(
    shouldFetch ? `/api/compare?slugs=${encodeURIComponent(compareQuery)}` : null,
    fetcher
  );

  const presets = presetsData?.data || [];
  const compareResult = compareData?.data;
  const models = React.useMemo(() => compareResult?.models || [], [compareResult]);
  const winners = compareResult?.winners;

  // Cost calculator state
  const [calcInput, setCalcInput] = React.useState(2000);
  const [calcOutput, setCalcOutput] = React.useState(500);
  const [calcRequests, setCalcRequests] = React.useState(100000);
  const [calcHitRate, setCalcHitRate] = React.useState(0);

  // Update URL helper
  const updateUrl = (nextSlugs: string[]) => {
    const deduped = Array.from(new Set(nextSlugs)).slice(0, 4);
    if (deduped.length > 0) {
      router.push(`/compare?models=${encodeURIComponent(deduped.join(","))}`);
    } else {
      router.push("/compare");
    }
  };

  const handleAddSlug = (slug: string) => {
    if (replaceIndex !== null) {
      const next = [...activeSlugs];
      next[replaceIndex] = slug;
      updateUrl(next);
      setReplaceIndex(null);
    } else if (activeSlugs.length < 4) {
      updateUrl([...activeSlugs, slug]);
    }
  };

  const handleRemoveSlug = (slugToRemove: string) => {
    updateUrl(activeSlugs.filter((s) => s !== slugToRemove));
  };

  const handleLoadPreset = (presetSlugs: string[]) => {
    updateUrl(presetSlugs);
  };

  // Helper to check if a model won a metric
  const isWinner = (winnerList: string[] | undefined, slug: string) => {
    return winnerList ? winnerList.includes(slug) : false;
  };

  // Compute Cost Comparison Results
  const costResults =
    models.length < 2
      ? []
      : models.map((m) => {
          const cost = estimateMonthlyCost({
            inputTokensPerRequest: calcInput,
            outputTokensPerRequest: calcOutput,
            requestsPerMonth: calcRequests,
            cacheHitPercent: calcHitRate,
            inputPrice: m.minInputPrice ?? 0,
            outputPrice: m.minOutputPrice ?? 0,
            cacheReadPrice: m.minCacheReadPrice,
          });
          return {
            slug: m.slug,
            name: displayName(m),
            lab: m.lab.name,
            cost,
          };
        });

  // Compute Benchmark Chart Data
  const benchmarkChartData: BenchmarkBarDataPoint[] = React.useMemo(() => {
    if (models.length < 2) return [];
    // Collect all unique benchmarks
    const bmMap = new Map<string, { name: string; scores: Record<string, number> }>();
    for (const m of models) {
      for (const bs of m.benchmarks) {
        if (!bmMap.has(bs.benchmark.slug)) {
          bmMap.set(bs.benchmark.slug, {
            name: bs.benchmark.name,
            scores: {},
          });
        }
        bmMap.get(bs.benchmark.slug)!.scores[m.slug] = bs.score;
      }
    }

    return Array.from(bmMap.values()).map((entry) => {
      const pt: BenchmarkBarDataPoint = { benchmark: entry.name };
      for (const m of models) {
        pt[m.slug] = entry.scores[m.slug];
      }
      return pt;
    });
  }, [models]);

  // Compute Radar Metrics Data (Normalized 0-100)
  const radarChartData: RadarDataPoint[] = React.useMemo(() => {
    if (models.length < 2) return [];

    const metrics = [
      {
        metric: "Context Window",
        getValue: (m: ModelDetailDto) => {
          const maxContext = Math.max(...models.map((x) => x.contextWindow ?? 0), 200000);
          return Math.round(((m.contextWindow ?? 0) / maxContext) * 100);
        },
      },
      {
        metric: "Throughput",
        getValue: (m: ModelDetailDto) => {
          const tps = Math.max(...m.providers.map((p) => p.throughputP50Tps ?? 0), 0);
          const maxTps = Math.max(
            ...models.flatMap((x) => x.providers.map((p) => p.throughputP50Tps ?? 0)),
            100
          );
          return Math.round((tps / maxTps) * 100);
        },
      },
      {
        metric: "Price Value",
        getValue: (m: ModelDetailDto) => {
          const prices = models.map((x) => x.blendedPrice ?? 10);
          const minP = Math.min(...prices);
          const maxP = Math.max(...prices);
          const bp = m.blendedPrice ?? maxP;
          if (maxP === minP) return 80;
          return Math.round(100 - ((bp - minP) / (maxP - minP)) * 70);
        },
      },
      {
        metric: "Intelligence",
        getValue: (m: ModelDetailDto) => {
          return m.intelligenceScore ? Math.round(m.intelligenceScore) : 40;
        },
      },
      {
        metric: "Coding",
        getValue: (m: ModelDetailDto) => {
          return m.codingScore ? Math.round(m.codingScore) : 40;
        },
      },
    ];

    return metrics.map((item) => {
      const point: RadarDataPoint = {
        metric: item.metric,
        fullMark: 100,
      };
      for (const m of models) {
        point[m.slug] = item.getValue(m);
      }
      return point;
    });
  }, [models]);

  const modelKeys = models.map((m, idx) => ({
    key: m.slug,
    name: displayName(m),
    color: MODEL_COLORS[idx % MODEL_COLORS.length],
  }));

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Page Title & Preset Chips */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent-warn" />
              <span>Side-by-Side Model Evaluation</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text tracking-tight">
              Compare AI Models
            </h1>
            <p className="text-sm text-muted mt-2 max-w-2xl font-sans">
              Compare pricing, context windows, benchmark performance, and provider routing across up to 4 models.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {activeSlugs.length > 0 && (
              <CopyButton value={currentUrl} label="Share link" />
            )}
            {activeSlugs.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setReplaceIndex(null);
                  setPickerOpen(true);
                }}
                className="gap-1.5 font-mono text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Model ({activeSlugs.length}/4)</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dynamic Preset Chips */}
        {presets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted mr-1">
              Popular Presets:
            </span>
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadPreset(preset.modelSlugs)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium rounded-full bg-surface border border-border hover:bg-surface-raised hover:text-text text-muted transition-colors cursor-pointer"
              >
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Error State: Unfound / Invalid Slugs */}
        {compareData && !compareData.success && (
          <div className="p-4 bg-accent-danger/10 border border-accent-danger/30 rounded-xl text-xs font-mono text-accent-danger flex items-center justify-between">
            <span>
              {compareData.error?.message || "One or more requested models could not be loaded."}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateUrl([])}
              className="text-xs"
            >
              Reset Comparison
            </Button>
          </div>
        )}

        {/* Empty State: 0 or 1 model */}
        {activeSlugs.length < 2 && (
          <div className="py-16 px-4 bg-surface/30 border border-border border-dashed rounded-[24px] text-center max-w-2xl mx-auto space-y-6">
            <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center mx-auto text-muted">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-normal text-text mb-2">
                Select at least 2 models to compare
              </h3>
              <p className="text-sm text-muted max-w-md mx-auto font-sans leading-relaxed">
                Add models using the picker button, select models from the catalog table, or click one of the pre-computed comparison presets above.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="primary-cream"
                size="md"
                onClick={() => {
                  setReplaceIndex(null);
                  setPickerOpen(true);
                }}
                className="gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Choose Model</span>
              </Button>
              <Link href="/">
                <Button variant="outline" size="md">
                  Browse Catalog
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Comparison Content (when >= 2 models) */}
        {activeSlugs.length >= 2 && (
          <>
            {compareLoading ? (
              <div className="py-24 text-center text-xs font-mono text-muted animate-pulse">
                Loading side-by-side model specifications...
              </div>
            ) : models.length >= 2 ? (
              <div className="space-y-12">
                {/* 1. Comparison Matrix Table */}
                <div className="w-full overflow-x-auto border border-border rounded-[16px] bg-surface/30 shadow-xs">
                  <table className="w-full text-left border-collapse text-xs select-none">
                    {/* Sticky Table Header with Model Info */}
                    <thead>
                      <tr className="border-b border-border bg-surface text-text">
                        <th scope="col" className="p-4 w-44 font-mono text-[11px] uppercase tracking-wider text-muted align-top sticky left-0 bg-surface z-10">
                          Model
                        </th>
                        {models.map((m, idx) => (
                          <th key={m.id} scope="col" className="p-4 min-w-[220px] max-w-[280px] align-top border-l border-border/60">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <LabAvatar slug={m.lab.slug} name={m.lab.name} size="md" />
                                  <div>
                                    <Link
                                      href={`/models/${m.slug}`}
                                      className="font-medium text-sm text-text hover:underline truncate block"
                                    >
                                      {displayName(m)}
                                    </Link>
                                    <span className="text-[11px] font-mono text-muted">
                                      {m.lab.name}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlug(m.slug)}
                                  className="text-muted hover:text-text p-1 rounded-md"
                                  title="Remove from compare"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: MODEL_COLORS[idx % MODEL_COLORS.length] }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplaceIndex(idx);
                                    setPickerOpen(true);
                                  }}
                                  className="text-[11px] font-mono text-muted hover:text-text hover:underline"
                                >
                                  Swap model
                                </button>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border/60 font-mono">
                      {/* Section 1: Overview */}
                      <tr className="bg-surface-raised/40">
                        <td colSpan={models.length + 1} className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-muted">
                          Overview
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Release Date</td>
                        {models.map((m) => (
                          <td key={m.id} className="py-2.5 px-4 text-text border-l border-border/40">
                            {m.releaseDate ? new Date(m.releaseDate).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) : "—"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Model Type</td>
                        {models.map((m) => (
                          <td key={m.id} className="py-2.5 px-4 text-text border-l border-border/40">
                            <Badge variant="outline">{m.modelType}</Badge>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Weights</td>
                        {models.map((m) => (
                          <td key={m.id} className="py-2.5 px-4 text-text border-l border-border/40">
                            {m.isOpenWeights ? (
                              <Badge variant="open">Open</Badge>
                            ) : (
                              <Badge variant="closed">Closed</Badge>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">License</td>
                        {models.map((m) => (
                          <td key={m.id} className="py-2.5 px-4 text-text truncate max-w-[200px] border-l border-border/40" title={m.license || "Proprietary"}>
                            {m.license || "Proprietary"}
                          </td>
                        ))}
                      </tr>

                      {/* Section 2: Pricing */}
                      <tr className="bg-surface-raised/40">
                        <td colSpan={models.length + 1} className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-muted">
                          Pricing (USD / 1M Tokens)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Input Price</td>
                        {models.map((m) => {
                          const won = isWinner(winners?.cheapestInput, m.slug);
                          return (
                            <td key={m.id} className={`py-2.5 px-4 tabular-nums border-l border-border/40 ${won ? "bg-[#8fc49a]/10 text-[#8fc49a] font-bold" : "text-text"}`}>
                              <div className="flex items-center justify-between">
                                <span>{formatPrice(m.minInputPrice)}</span>
                                {won && <span className="text-[9px] uppercase px-1 py-0.2 rounded-xs bg-[#8fc49a]/20">Best</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Output Price</td>
                        {models.map((m) => {
                          const won = isWinner(winners?.cheapestOutput, m.slug);
                          return (
                            <td key={m.id} className={`py-2.5 px-4 tabular-nums border-l border-border/40 ${won ? "bg-[#8fc49a]/10 text-[#8fc49a] font-bold" : "text-text"}`}>
                              <div className="flex items-center justify-between">
                                <span>{formatPrice(m.minOutputPrice)}</span>
                                {won && <span className="text-[9px] uppercase px-1 py-0.2 rounded-xs bg-[#8fc49a]/20">Best</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Blended Price (3:1)</td>
                        {models.map((m) => {
                          const won = isWinner(winners?.cheapestBlended, m.slug);
                          return (
                            <td key={m.id} className={`py-2.5 px-4 tabular-nums border-l border-border/40 ${won ? "bg-[#8fc49a]/10 text-[#8fc49a] font-bold" : "text-text"}`}>
                              <div className="flex items-center justify-between">
                                <span>{formatPrice(m.blendedPrice)}</span>
                                {won && <span className="text-[9px] uppercase px-1 py-0.2 rounded-xs bg-[#8fc49a]/20">Best</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Cache Read Price</td>
                        {models.map((m) => (
                          <td key={m.id} className="py-2.5 px-4 text-muted tabular-nums border-l border-border/40">
                            {formatPrice(m.minCacheReadPrice)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Lowest Host</td>
                        {models.map((m) => (
                          <td key={m.id} className="py-2.5 px-4 text-text truncate border-l border-border/40">
                            {m.cheapestProvider?.name || "—"}
                          </td>
                        ))}
                      </tr>

                      {/* Section 3: Technical Specs */}
                      <tr className="bg-surface-raised/40">
                        <td colSpan={models.length + 1} className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-muted">
                          Technical Specifications
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Context Window</td>
                        {models.map((m) => {
                          const won = isWinner(winners?.largestContext, m.slug);
                          return (
                            <td key={m.id} className={`py-2.5 px-4 tabular-nums border-l border-border/40 ${won ? "bg-[#8fc49a]/10 text-[#8fc49a] font-bold" : "text-text"}`}>
                              <div className="flex items-center justify-between">
                                <span>{formatContext(m.contextWindow)}</span>
                                {won && <span className="text-[9px] uppercase px-1 py-0.2 rounded-xs bg-[#8fc49a]/20">Best</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Max Output</td>
                        {models.map((m) => {
                          const won = isWinner(winners?.largestMaxOutput, m.slug);
                          return (
                            <td key={m.id} className={`py-2.5 px-4 tabular-nums border-l border-border/40 ${won ? "bg-[#8fc49a]/10 text-[#8fc49a] font-bold" : "text-text"}`}>
                              <div className="flex items-center justify-between">
                                <span>{formatContext(m.maxOutputTokens)}</span>
                                {won && <span className="text-[9px] uppercase px-1 py-0.2 rounded-xs bg-[#8fc49a]/20">Best</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Peak Throughput</td>
                        {models.map((m) => {
                          const won = isWinner(winners?.fastestThroughput, m.slug);
                          const tps = Math.max(...m.providers.map((p) => p.throughputP50Tps ?? 0), 0);
                          return (
                            <td key={m.id} className={`py-2.5 px-4 tabular-nums border-l border-border/40 ${won ? "bg-[#8fc49a]/10 text-[#8fc49a] font-bold" : "text-text"}`}>
                              <div className="flex items-center justify-between">
                                <span>{tps > 0 ? `${tps.toFixed(1)} tps` : "—"}</span>
                                {won && tps > 0 && <span className="text-[9px] uppercase px-1 py-0.2 rounded-xs bg-[#8fc49a]/20">Best</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Active Providers</td>
                        {models.map((m) => (
                          <td key={m.id} className="py-2.5 px-4 text-text tabular-nums border-l border-border/40">
                            {m.providerCount}
                          </td>
                        ))}
                      </tr>

                      {/* Section 4: Capabilities */}
                      <tr className="bg-surface-raised/40">
                        <td colSpan={models.length + 1} className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-muted">
                          Capabilities &amp; Modalities
                        </td>
                      </tr>
                      {["tool_calling", "reasoning", "structured_outputs", "temperature", "files"].map((capKey) => {
                        const labels: Record<string, string> = {
                          tool_calling: "Tool Calling",
                          reasoning: "Reasoning Tokens",
                          structured_outputs: "JSON Schema",
                          temperature: "Custom Temperature",
                          files: "Document Input",
                        };
                        return (
                          <tr key={capKey}>
                            <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">{labels[capKey]}</td>
                            {models.map((m) => {
                              const hasCap = m.capabilities.includes(capKey);
                              return (
                                <td key={m.id} className="py-2.5 px-4 border-l border-border/40">
                                  {hasCap ? (
                                    <Check className="w-4 h-4 text-[#8fc49a]" />
                                  ) : (
                                    <span className="text-muted/40">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                      {/* Section 5: Intelligence & Benchmarks */}
                      <tr className="bg-surface-raised/40">
                        <td colSpan={models.length + 1} className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-muted">
                          Benchmark Scores
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Intelligence Index</td>
                        {models.map((m) => (
                          <td key={m.id} className="py-2.5 px-4 text-text font-bold tabular-nums border-l border-border/40">
                            {formatScore(m.intelligenceScore)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-muted sticky left-0 bg-background/90">Coding Index</td>
                        {models.map((m) => (
                          <td key={m.id} className="py-2.5 px-4 text-text font-bold tabular-nums border-l border-border/40">
                            {formatScore(m.codingScore)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Visual Comparison Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* Benchmark Bar Chart */}
                  <div className="bg-surface border border-border rounded-[16px] p-5 space-y-4 shadow-xs">
                    <div>
                      <h3 className="font-serif text-xl font-normal text-text">
                        Benchmark Leaderboard Comparison
                      </h3>
                      <p className="text-xs text-muted mt-1 font-sans">
                        Side-by-side performance across cited public benchmarks
                      </p>
                    </div>
                    <BenchmarkBarChart
                      data={benchmarkChartData}
                      modelKeys={modelKeys}
                    />
                  </div>

                  {/* Radar Metric Balance Chart */}
                  <div className="bg-surface border border-border rounded-[16px] p-5 space-y-4 shadow-xs">
                    <div>
                      <h3 className="font-serif text-xl font-normal text-text">
                        Normalized Feature Tradeoffs
                      </h3>
                      <p className="text-xs text-muted mt-1 font-sans">
                        Tradeoffs across context size, throughput, cost value, and capabilities
                      </p>
                    </div>
                    <RadarMetricsChart
                      data={radarChartData}
                      modelKeys={modelKeys}
                    />
                  </div>
                </div>

                {/* 3. Cost Comparison Across Models */}
                <div className="bg-surface border border-border rounded-[16px] p-6 space-y-6 shadow-xs select-none">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-border">
                    <Calculator className="w-5 h-5 text-accent-warn" />
                    <div>
                      <h3 className="font-serif text-xl font-normal text-text">
                        Comparative Workload Cost Estimator
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        Calculate monthly bill difference across the compared models for identical traffic
                      </p>
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-muted text-[11px] uppercase">Input Tokens</span>
                        <span className="text-text font-medium">{calcInput.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={16000}
                        step={100}
                        value={calcInput}
                        onChange={(e) => setCalcInput(Number(e.target.value))}
                        className="w-full accent-[#e5dfd2] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-muted text-[11px] uppercase">Output Tokens</span>
                        <span className="text-text font-medium">{calcOutput.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={4000}
                        step={50}
                        value={calcOutput}
                        onChange={(e) => setCalcOutput(Number(e.target.value))}
                        className="w-full accent-[#e5dfd2] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-muted text-[11px] uppercase">Requests / Mo</span>
                        <span className="text-text font-medium">{calcRequests.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min={10000}
                        max={1000000}
                        step={10000}
                        value={calcRequests}
                        onChange={(e) => setCalcRequests(Number(e.target.value))}
                        className="w-full accent-[#e5dfd2] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-muted text-[11px] uppercase">Cache Hit %</span>
                        <span className="text-text font-medium">{calcHitRate}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={calcHitRate}
                        onChange={(e) => setCalcHitRate(Number(e.target.value))}
                        className="w-full accent-[#8fc49a] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Cost Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {costResults.map((item) => {
                      const minCost = Math.min(...costResults.map((r) => r.cost.totalCost));
                      const isCheapestModel = item.cost.totalCost === minCost;
                      return (
                        <div
                          key={item.slug}
                          className={`p-4 rounded-xl border flex flex-col justify-between ${
                            isCheapestModel
                              ? "bg-[#8fc49a]/10 border-[#8fc49a]/40"
                              : "bg-surface-raised border-border"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-text truncate max-w-[150px]">
                                {item.name}
                              </span>
                              {isCheapestModel && (
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-xs bg-[#8fc49a]/20 text-[#8fc49a]">
                                  Lowest Cost
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-muted mb-3">
                              {item.lab}
                            </div>
                          </div>

                          <div className="space-y-1 font-mono pt-2 border-t border-border/50">
                            <div className="flex justify-between text-[11px] text-muted">
                              <span>Blended $/1M:</span>
                              <span className="tabular-nums">${item.cost.blendedPricePer1M.toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-text tabular-nums pt-1">
                              <span>Est. Monthly:</span>
                              <span className={isCheapestModel ? "text-[#8fc49a]" : "text-white"}>
                                ${item.cost.totalCost.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Model Search & Add Popover */}
      <CompareModelPicker
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setReplaceIndex(null);
        }}
        onSelect={handleAddSlug}
        currentSlugs={activeSlugs}
      />
    </div>
  );
}
