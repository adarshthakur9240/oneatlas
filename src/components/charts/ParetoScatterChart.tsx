// src/components/charts/ParetoScatterChart.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { displayName } from "@/lib/formatters";
import {
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import type { ParetoPoint } from "@/lib/pareto";

interface ParetoScatterChartProps {
  allPoints: Array<ParetoPoint & { isFrontier?: boolean; fullName?: string }>;
  frontierPoints: ParetoPoint[];
  scoreLabel?: string;
}

function InnerParetoScatterChart({
  allPoints,
  frontierPoints,
  scoreLabel = "Intelligence Score",
}: ParetoScatterChartProps) {
  // Format data for chart
  // Free models (price 0) are plotted at axis floor e.g. 0.01 with a note
  const processedPoints = allPoints.map((p) => ({
    ...p,
    fullName: p.fullName || p.name,
    plotPrice: p.price === 0 ? 0.02 : p.price,
    displayPrice: p.price === 0 ? "Free ($0.00)" : `$${p.price.toFixed(3)}`,
  }));

  // Create stepped line points for the Pareto frontier:
  // For each step from (p0, s0) to (p1, s1), the step line maintains s0 until p1 then rises to s1.
  const steppedLineData: Array<{ plotPrice: number; score: number }> = [];
  if (frontierPoints.length > 0) {
    const sortedFrontier = [...frontierPoints].sort((a, b) => a.price - b.price);
    for (let i = 0; i < sortedFrontier.length; i++) {
      const curr = sortedFrontier[i];
      const plotP = curr.price === 0 ? 0.02 : curr.price;
      if (i > 0) {
        // Step horizontally to new price at old score
        steppedLineData.push({ plotPrice: plotP, score: sortedFrontier[i - 1].score });
      }
      steppedLineData.push({ plotPrice: plotP, score: curr.score });
    }
  }

  const frontierSet = new Set(frontierPoints.map((p) => p.slug));
  const frontierScatter = processedPoints.filter((p) => frontierSet.has(p.slug));
  const otherScatter = processedPoints.filter((p) => !frontierSet.has(p.slug));

  // Candidate log ticks per user spec: $0.1, $1, $10, $100
  // Filter to only those within the data range
  const candidateTicks = [0.1, 1, 10, 100];
  const allPrices = processedPoints.map((p) => p.plotPrice);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0.02;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 100;

  const dataTicks = candidateTicks.filter((t) => t >= minPrice && t <= maxPrice);
  const xTicks =
    dataTicks.length > 0
      ? dataTicks
      : candidateTicks.filter((t, i) => i === 0 || t <= maxPrice);

  const formatDollarTick = (v: number): string => {
    if (v === 0.1) return "$0.1";
    if (v === 1) return "$1";
    if (v === 10) return "$10";
    if (v === 100) return "$100";
    return `$${v}`;
  };

  const yAxisTitle =
    scoreLabel.includes("Artificial Analysis") || scoreLabel === "Intelligence Score"
      ? "Intelligence Index"
      : scoreLabel;

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-muted gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8fc49a]" />
            <span className="text-text font-medium">Pareto Frontier (Optimal Tradeoff)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6f6b62]" />
            <span>Other Models</span>
          </span>
        </div>
        <span className="text-subtle text-[11px]">
          * Free models plotted at baseline for log-scale visibility
        </span>
      </div>

      <div className="h-96 w-full select-none bg-surface/50 border border-border rounded-xl p-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2d2a" />
            <XAxis
              type="number"
              dataKey="plotPrice"
              name="Price / 1M"
              scale="log"
              domain={["auto", "auto"]}
              ticks={xTicks}
              tickFormatter={formatDollarTick}
              stroke="#6f6b62"
              tick={{ fill: "#9b968b", fontSize: 11, fontFamily: "var(--font-mono)" }}
              label={{
                value: "Blended Price / 1M Tokens (Log Scale, USD)",
                position: "insideBottom",
                offset: -12,
                fill: "#9b968b",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
            />
            <YAxis
              type="number"
              dataKey="score"
              name={yAxisTitle}
              domain={[0, 100]}
              stroke="#6f6b62"
              tick={{ fill: "#9b968b", fontSize: 11, fontFamily: "var(--font-mono)" }}
              label={{
                value: yAxisTitle,
                angle: -90,
                position: "insideLeft",
                fill: "#9b968b",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "#3a3935" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  if (!data.name) return null;
                  const isF = frontierSet.has(data.slug);
                  return (
                    <div className="bg-surface-raised border border-border-strong rounded-lg p-3 shadow-2xl text-xs font-mono max-w-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className="font-semibold text-text truncate"
                          title={data.fullName || data.name}
                          aria-label={data.fullName || data.name}
                        >
                          {displayName(data.name)}
                        </span>
                        {isF && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#8fc49a]/20 text-[#8fc49a] border border-[#8fc49a]/30">
                            Pareto Efficient
                          </span>
                        )}
                      </div>
                      <div className="text-muted text-[11px] mb-2">{data.lab}</div>
                      <div className="space-y-1 border-t border-border/60 pt-1.5">
                        <div className="flex justify-between">
                          <span className="text-muted">Blended Price:</span>
                          <span className="text-text font-bold tabular-nums">{data.displayPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">{yAxisTitle}:</span>
                          <span className="text-text font-bold tabular-nums">{data.score.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Stepped Frontier Line */}
            <Line
              type="stepAfter"
              data={steppedLineData}
              dataKey="score"
              stroke="#8fc49a"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />

            {/* Dominated Points */}
            <Scatter
              name="All Models"
              data={otherScatter}
              fill="#6f6b62"
              opacity={0.6}
            />

            {/* Frontier Points */}
            <Scatter
              name="Frontier"
              data={frontierScatter}
              fill="#8fc49a"
              stroke="#161614"
              strokeWidth={1.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const ParetoScatterChart = dynamic(
  () => Promise.resolve(InnerParetoScatterChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full flex items-center justify-center bg-surface/40 border border-border rounded-xl">
        <span className="text-xs font-mono text-muted animate-pulse">
          Loading Pareto frontier scatter...
        </span>
      </div>
    ),
  }
);
