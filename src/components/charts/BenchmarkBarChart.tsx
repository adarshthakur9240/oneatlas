// src/components/charts/BenchmarkBarChart.tsx
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
  Legend,
} from "recharts";

export interface BenchmarkBarDataPoint {
  benchmark: string;
  category?: string;
  [modelName: string]: string | number | undefined;
}

interface BenchmarkBarChartProps {
  data: BenchmarkBarDataPoint[];
  modelKeys: Array<{ key: string; name: string; color: string; dashPattern?: string }>;
  unit?: string;
}

function InnerBenchmarkBarChart({
  data,
  modelKeys,
  unit = "%",
}: BenchmarkBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-xs font-mono text-muted">
        No benchmark data available to compare.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="h-80 w-full select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 16, right: 16, left: -10, bottom: 20 }}
            barCategoryGap={24}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2d2a" vertical={false} />
            <XAxis
              dataKey="benchmark"
              stroke="#6f6b62"
              tick={{ fill: "#9b968b", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "#2e2d2a" }}
            />
            <YAxis
              stroke="#6f6b62"
              tick={{ fill: "#9b968b", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "#2e2d2a" }}
              domain={[0, 100]}
              unit={unit}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-surface-raised border border-border-strong rounded-lg p-3 shadow-xl text-xs font-mono">
                      <div className="font-semibold text-text mb-2">{label}</div>
                      <div className="space-y-1">
                        {payload.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span>{entry.name}:</span>
                            </span>
                            <span className="text-text font-bold tabular-nums">
                              {entry.value !== undefined ? `${entry.value}${unit}` : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 16, fontSize: 12, fontFamily: "var(--font-mono)" }}
            />
            {modelKeys.map((m) => (
              <Bar
                key={m.key}
                dataKey={m.key}
                name={m.name}
                fill={m.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible Text Fallback Table */}
      <div className="sr-only">
        <table>
          <caption>Benchmark scores across compared models</caption>
          <thead>
            <tr>
              <th scope="col">Benchmark</th>
              {modelKeys.map((m) => (
                <th key={m.key} scope="col">{m.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td>{row.benchmark}</td>
                {modelKeys.map((m) => (
                  <td key={m.key}>{row[m.key] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const BenchmarkBarChart = dynamic(
  () => Promise.resolve(InnerBenchmarkBarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full flex items-center justify-center bg-surface/40 border border-border rounded-xl">
        <span className="text-xs font-mono text-muted animate-pulse">
          Loading benchmark chart...
        </span>
      </div>
    ),
  }
);
