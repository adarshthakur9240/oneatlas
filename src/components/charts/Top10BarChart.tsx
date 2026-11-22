// src/components/charts/Top10BarChart.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export interface Top10Item {
  rank: number;
  name: string;
  score: number;
  lab: string;
  unit?: string;
}

interface Top10BarChartProps {
  data: Top10Item[];
  scoreLabel?: string;
  unit?: string;
}

function InnerTop10BarChart({
  data,
  scoreLabel = "Score",
  unit = "%",
}: Top10BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-xs font-mono text-muted">
        No ranked data available.
      </div>
    );
  }

  // Preserve descending order: rank 1 at the top, rank 10 at the bottom
  const chartData = [...data];

  // Headroom for score labels placed at the end of each bar
  const maxScore = Math.max(...chartData.map((d) => d.score), 100);
  const domainMax = Math.ceil(maxScore > 100 ? maxScore * 1.08 : 100);

  return (
    <div className="w-full space-y-3">
      <div className="h-84 w-full select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 48, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2d2a" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, domainMax]}
              stroke="#6f6b62"
              tick={{ fill: "#9b968b", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "#2e2d2a" }}
              unit={unit}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              stroke="#6f6b62"
              tick={{ fill: "#f2eee6", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "#2e2d2a" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as Top10Item;
                  return (
                    <div className="bg-surface-raised border border-border-strong rounded-lg p-2.5 shadow-xl text-xs font-mono">
                      <div className="font-semibold text-text">{item.name}</div>
                      <div className="text-[11px] text-muted mb-1.5">{item.lab} · Rank #{item.rank}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted">{scoreLabel}:</span>
                        <span className="text-[#8fc49a] font-bold tabular-nums">
                          {item.score.toFixed(1)}{unit}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="score"
              fill="#8fc49a"
              radius={[0, 4, 4, 0]}
              maxBarSize={20}
            >
              <LabelList
                dataKey="score"
                position="right"
                fill="#9b968b"
                fontSize={11}
                fontFamily="var(--font-mono)"
                formatter={(val: unknown) =>
                  typeof val === "number" ? val.toFixed(1) : String(val ?? "")
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const Top10BarChart = dynamic(
  () => Promise.resolve(InnerTop10BarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-84 w-full flex items-center justify-center bg-surface/40 border border-border rounded-xl">
        <span className="text-xs font-mono text-muted animate-pulse">
          Loading top 10 leaderboard chart...
        </span>
      </div>
    ),
  }
);
