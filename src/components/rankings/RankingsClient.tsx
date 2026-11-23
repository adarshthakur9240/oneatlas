// src/components/rankings/RankingsClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { useCompare } from "@/lib/compare-store";
import { displayName, formatPrice, formatContext } from "@/lib/formatters";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { paretoFrontier } from "@/lib/pareto";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { Badge } from "@/components/ui/Badge";
import { Top10BarChart, Top10Item } from "@/components/charts/Top10BarChart";
import { ParetoScatterChart } from "@/components/charts/ParetoScatterChart";
import {
  Trophy,
  ArrowRight,
  Info,
  Check,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { RankingRowDto } from "@/types/api";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const BENCHMARK_TABS = [
  {
    slug: "intelligence-index",
    name: "Artificial Analysis Intelligence Index",
    shortName: "AA Intelligence",
    unit: " Index",
    basisNote: "Basis: Artificial Analysis calibrated index (0–100 scale, independent evaluation). Standardized multi-domain reasoning harness.",
  },
  {
    slug: "composite",
    name: "Vendor composite (earlier models)",
    shortName: "Vendor composite",
    unit: "%",
    basisNote: "Basis: Vendor-reported composite normalized to 0–100 scale. Not directly comparable to the calibrated AA Index.",
  },
  {
    slug: "coding-index",
    name: "Artificial Analysis Coding Index",
    shortName: "AA Coding",
    unit: " Index",
    basisNote: "Basis: Artificial Analysis coding index (0–100 scale, independent evaluation).",
  },
  {
    slug: "mmlu-pro",
    name: "MMLU-Pro",
    shortName: "MMLU-Pro",
    unit: "%",
    basisNote: "Basis: Massive Multitask Language Understanding (Pro) accuracy percentage (vendor-reported).",
  },
  {
    slug: "gpqa-diamond",
    name: "GPQA Diamond",
    shortName: "GPQA Diamond",
    unit: "%",
    basisNote: "Basis: Graduate-level Google-Proof Q&A accuracy percentage (vendor-reported).",
  },
  {
    slug: "swe-bench-verified",
    name: "SWE-bench Verified",
    shortName: "SWE-bench Verified",
    unit: "%",
    basisNote: "Basis: Human-verified real GitHub issue resolution percentage (vendor-reported).",
  },
  {
    slug: "livecodebench",
    name: "LiveCodeBench",
    shortName: "LiveCodeBench",
    unit: "%",
    basisNote: "Basis: Live competitive programming pass@1 percentage (vendor-reported).",
  },
  {
    slug: "arena-elo",
    name: "Chatbot Arena Elo",
    shortName: "Arena Elo",
    unit: " Elo",
    basisNote: "Basis: LMSYS Chatbot Arena blind pairwise human-preference Elo rating.",
  },
];

const CATEGORY_FILTERS = [
  { id: "all", label: "All Models" },
  { id: "FLAGSHIP", label: "Flagship" },
  { id: "REASONING", label: "Reasoning" },
  { id: "CODING", label: "Coding" },
  { id: "FAST", label: "Fast" },
  { id: "open_weights", label: "Open Weights" },
];

export function RankingsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { has, toggle } = useCompare();

  const activeBenchmark = searchParams.get("benchmark") || "intelligence-index";
  const activeCategory = searchParams.get("category") || "all";
  const [sortField, setSortField] = React.useState<"rank" | "score" | "price" | "value">("rank");
  const [sortAsc, setSortAsc] = React.useState(true);

  const activeTab =
    BENCHMARK_TABS.find((t) => t.slug === activeBenchmark) || BENCHMARK_TABS[0];
  const activeBmTitle = activeTab.name;
  const activeBmUnit = activeTab.unit;

  // Construct API query
  const queryParams = new URLSearchParams();
  queryParams.set("benchmark", activeBenchmark);
  queryParams.set("limit", "100");
  if (activeCategory !== "all") {
    if (activeCategory === "open_weights") {
      queryParams.set("openWeights", "true");
    } else {
      queryParams.set("type", activeCategory);
    }
  }

  const { data, isLoading } = useSWR<{
    success: boolean;
    data: RankingRowDto[];
    meta?: {
      scoredModels: number;
      totalListableModels: number;
      coveragePct: number;
    };
  }>(`/api/rankings?${queryParams.toString()}`, fetcher);

  const rows = data?.data || [];
  const meta = data?.meta;
  const scoredCount = meta?.scoredModels ?? rows.length;
  const totalCount = meta?.totalListableModels ?? 448;

  const updateFilters = (newBm?: string, newCat?: string) => {
    const p = new URLSearchParams();
    p.set("benchmark", newBm ?? activeBenchmark);
    if ((newCat ?? activeCategory) !== "all") {
      p.set("category", newCat ?? activeCategory);
    }
    router.push(`/rankings?${p.toString()}`);
  };

  // Top 10 data for bar chart
  const top10Data: Top10Item[] = rows.slice(0, 10).map((r) => ({
    rank: r.rank,
    name: displayName(r.model),
    fullName: r.model.name,
    score: r.score,
    lab: r.model.lab.name,
    unit: activeBmUnit,
  }));

  // Pareto Frontier computation
  const paretoPoints = rows
    .filter((r) => r.blendedPrice !== null)
    .map((r) => ({
      slug: r.model.slug,
      name: displayName(r.model),
      fullName: r.model.name,
      lab: r.model.lab.name,
      price: r.blendedPrice ?? 0,
      score: r.score,
      isFree: r.isFree,
    }));

  const frontier = paretoFrontier(paretoPoints);

  // Sorted leaderboard rows
  const sortedRows = [...rows].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "rank":
        cmp = a.rank - b.rank;
        break;
      case "score":
        cmp = b.score - a.score;
        break;
      case "price":
        cmp = (a.blendedPrice ?? Infinity) - (b.blendedPrice ?? Infinity);
        break;
      case "value":
        cmp = (b.valueIndex ?? 0) - (a.valueIndex ?? 0);
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "rank" || field === "price");
    }
  };

  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="pb-6 border-b border-border">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted mb-2">
            <Trophy className="w-3.5 h-3.5 text-accent-warn" />
            <span>Leaderboard &amp; Empirical Rankings</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text tracking-tight">
            AI Model Rankings
          </h1>
          <p className="text-sm text-muted mt-2 max-w-2xl font-sans">
            Comprehensive evaluation rankings across general intelligence, coding capability, and standardized public benchmarks.
          </p>
        </div>

        {/* Benchmark Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs font-mono">
          {BENCHMARK_TABS.map((tab) => {
            const active = activeBenchmark === tab.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => updateFilters(tab.slug, undefined)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? "bg-surface-raised text-text font-bold border border-border-strong shadow-2xs"
                    : "text-muted hover:text-text hover:bg-surface/60"
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-muted uppercase tracking-wider text-[11px] mr-1">
            Category:
          </span>
          {CATEGORY_FILTERS.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilters(undefined, cat.id)}
                className={`px-2.5 py-1 rounded-[6px] border transition-colors cursor-pointer ${
                  active
                    ? "bg-surface-raised border-border-strong text-text font-medium"
                    : "border-border text-muted hover:text-text hover:bg-surface/50"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Honest Citation Banner */}
        <div
          className="p-4 bg-surface border border-border rounded-xl space-y-2 text-xs font-mono text-muted"
          aria-live="polite"
        >
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-accent-warn shrink-0" />
              <span>
                Coverage: <strong className="text-text font-semibold">{scoredCount} of {totalCount}</strong> models
                have published, cited scores for {activeBmTitle}. Models without scores are not ranked.
              </span>
            </div>
            <Link
              href="/benchmarks"
              className="inline-flex items-center gap-1 text-text hover:underline shrink-0 font-medium"
            >
              <span>Methodology</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {activeTab.basisNote && (
            <div className="text-[11px] text-text/80 pl-6.5 border-t border-border/40 pt-1.5 font-sans">
              <span className="font-mono text-muted uppercase text-[10px] mr-1.5">Note:</span>
              {activeTab.basisNote}
            </div>
          )}
        </div>

        {/* Visual Charts Grid: Top-10 Bar Chart & Pareto Scatter Plot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Top 10 Leaderboard Bar Chart */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-[16px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-normal text-text">
                  Top 10: {activeBmTitle}
                </h3>
                <p className="text-xs text-muted font-sans mt-0.5">
                  Leading models ranked by verified empirical evaluations
                </p>
              </div>
            </div>
            <Top10BarChart
              data={top10Data}
              scoreLabel={activeBmTitle}
              unit={activeBmUnit}
            />
          </div>

          {/* Pareto Frontier Scatter Chart */}
          <div className="lg:col-span-7 bg-surface border border-border rounded-[16px] p-5 space-y-4 shadow-xs">
            <div>
              <h3 className="font-serif text-lg font-normal text-text">
                Intelligence vs. Price Tradeoff
              </h3>
              <p className="text-xs text-muted font-sans mt-0.5">
                Stepped Pareto frontier highlighting models with optimal score-to-cost efficiency
              </p>
            </div>
            <ParetoScatterChart
              allPoints={paretoPoints}
              frontierPoints={frontier}
              scoreLabel={activeBmTitle}
            />
          </div>
        </div>

        {/* Full Leaderboard Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-normal text-text">
              Full Ranked Leaderboard
            </h3>
            <span className="text-xs font-mono text-muted">
              {rows.length} {rows.length === 1 ? "model" : "models"} ranked
            </span>
          </div>

          <div className="w-full overflow-x-auto border border-border rounded-[16px] bg-surface/30 shadow-xs">
            <table className="w-full text-left border-collapse text-xs select-none font-mono">
              <thead>
                <tr className="border-b border-border bg-surface text-muted uppercase text-[11px] tracking-[0.08em] whitespace-nowrap">
                  <th scope="col" className="py-3 px-3 w-16 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("rank")}
                      className="inline-flex items-center gap-1 hover:text-text cursor-pointer"
                    >
                      <span>Rank</span>
                      {sortField === "rank" && (sortAsc ? <ArrowUp className="w-3 h-3 text-text" /> : <ArrowDown className="w-3 h-3 text-text" />)}
                    </button>
                  </th>

                  <th scope="col" className="py-3 px-4">
                    Model &amp; Lab
                  </th>

                  <th scope="col" className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("score")}
                      className="inline-flex items-center gap-1 hover:text-text cursor-pointer ml-auto"
                    >
                      <span>{activeBmTitle}</span>
                      {sortField === "score" && (sortAsc ? <ArrowUp className="w-3 h-3 text-text" /> : <ArrowDown className="w-3 h-3 text-text" />)}
                    </button>
                  </th>

                  <th scope="col" className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("price")}
                      className="inline-flex items-center gap-1 hover:text-text cursor-pointer ml-auto"
                    >
                      <span>Blended $/1M</span>
                      {sortField === "price" && (sortAsc ? <ArrowUp className="w-3 h-3 text-text" /> : <ArrowDown className="w-3 h-3 text-text" />)}
                    </button>
                  </th>

                  <th scope="col" className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("value")}
                      className="inline-flex items-center gap-1 hover:text-text cursor-pointer ml-auto"
                      title="Score per dollar (Intelligence / Blended Price)"
                    >
                      <span>Value Index</span>
                      {sortField === "value" && (sortAsc ? <ArrowUp className="w-3 h-3 text-text" /> : <ArrowDown className="w-3 h-3 text-text" />)}
                    </button>
                  </th>

                  <th scope="col" className="py-3 px-3 text-right">
                    Context
                  </th>

                  <th scope="col" className="py-3 px-3 text-center">
                    Weights
                  </th>

                  <th scope="col" className="py-3 px-3 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted">
                      Loading ranking leaderboard...
                    </td>
                  </tr>
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted">
                      No models match the selected category filter.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((r) => {
                    const inCompare = has(r.model.slug);
                    return (
                      <tr
                        key={r.model.id}
                        className="h-14 hover:bg-surface/80 transition-colors group cursor-default"
                      >
                        {/* Rank */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold tabular-nums text-xs ${
                              r.rank === 1
                                ? "bg-accent-warn/20 text-accent-warn border border-accent-warn/40"
                                : r.rank === 2
                                ? "bg-slate-300/20 text-slate-200 border border-slate-300/30"
                                : r.rank === 3
                                ? "bg-[#d9a441]/15 text-[#d9a441] border border-[#d9a441]/30"
                                : "text-muted"
                            }`}
                          >
                            {r.rank}
                          </span>
                        </td>

                        {/* Model & Lab */}
                        <td className="py-2.5 px-4 font-sans">
                          <div className="flex items-center gap-3">
                            <LabAvatar slug={r.model.lab.slug} name={r.model.lab.name} size="sm" />
                            <div className="flex flex-col min-w-0">
                              <Link
                                href={`/models/${r.model.slug}`}
                                title={r.model.name}
                                aria-label={r.model.name}
                                className="font-medium text-text hover:underline text-xs truncate max-w-[220px]"
                              >
                                {displayName(r.model)}
                              </Link>
                              <span className="text-[11px] font-mono text-muted">
                                {r.model.lab.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-2.5 px-3 text-right font-bold text-text tabular-nums">
                          <ScoreDisplay
                            score={r.score}
                            scoreBasis={r.scoreBasis}
                            unit={activeBmUnit}
                          />
                        </td>

                        {/* Blended Price */}
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted">
                          {r.isFree ? (
                            <span className="text-[#8fc49a] font-semibold">Free</span>
                          ) : (
                            formatPrice(r.blendedPrice)
                          )}
                        </td>

                        {/* Value Index */}
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {r.valueIndex !== null ? (
                            <span className="text-[#8fc49a] font-medium">
                              {r.valueIndex.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted/40">—</span>
                          )}
                        </td>

                        {/* Context */}
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted">
                          {formatContext(r.contextWindow)}
                        </td>

                        {/* Weights */}
                        <td className="py-2.5 px-3 text-center">
                          {r.model.isOpenWeights ? (
                            <Badge variant="open">Open</Badge>
                          ) : (
                            <span className="text-subtle text-[11px]">Closed</span>
                          )}
                        </td>

                        {/* Actions: Compare & Detail */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggle(r.model.slug)}
                              aria-label={inCompare ? "Remove from compare" : "Add to compare"}
                              className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer ${
                                inCompare
                                  ? "bg-[#e5dfd2] text-[#1b1a17] font-bold shadow-xs"
                                  : "text-muted hover:text-text hover:bg-surface-raised border border-border"
                              }`}
                            >
                              {inCompare ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>

                            <Link
                              href={`/models/${r.model.slug}`}
                              className="p-1 text-muted hover:text-text rounded-md hover:bg-surface-raised"
                              title="View model details"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
