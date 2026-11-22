// src/components/charts/RadarMetricsChart.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export interface RadarDataPoint {
  metric: string;
  fullMark: number;
  [modelKey: string]: string | number;
}

interface RadarMetricsChartProps {
  data: RadarDataPoint[];
  modelKeys: Array<{ key: string; name: string; color: string }>;
}

function InnerRadarMetricsChart({ data, modelKeys }: RadarMetricsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-xs font-mono text-muted">
        No comparative metrics available.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="h-80 w-full select-none">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#2e2d2a" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#9b968b", fontSize: 11, fontFamily: "var(--font-mono)" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              stroke="#3a3935"
              tick={{ fill: "#6f6b62", fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const metricName = payload[0]?.payload?.metric;
                  return (
                    <div className="bg-surface-raised border border-border-strong rounded-lg p-3 shadow-xl text-xs font-mono">
                      <div className="font-semibold text-text mb-2">{metricName} (0-100)</div>
                      <div className="space-y-1">
                        {payload.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4">
                            <span style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="text-text font-bold tabular-nums">
                              {entry.value}/100
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
              wrapperStyle={{ paddingTop: 10, fontSize: 11, fontFamily: "var(--font-mono)" }}
            />
            {modelKeys.map((m, idx) => (
              <Radar
                key={m.key}
                name={m.name}
                dataKey={m.key}
                stroke={m.color}
                fill={m.color}
                fillOpacity={0.25 - idx * 0.05}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible Table */}
      <div className="sr-only">
        <table>
          <caption>Normalized metrics (0-100)</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              {modelKeys.map((m) => (
                <th key={m.key} scope="col">{m.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td>{row.metric}</td>
                {modelKeys.map((m) => (
                  <td key={m.key}>{row[m.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const RadarMetricsChart = dynamic(
  () => Promise.resolve(InnerRadarMetricsChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full flex items-center justify-center bg-surface/40 border border-border rounded-xl">
        <span className="text-xs font-mono text-muted animate-pulse">
          Loading radar metrics...
        </span>
      </div>
    ),
  }
);
