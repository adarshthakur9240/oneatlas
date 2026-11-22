// src/components/models/ModelBenchmarks.tsx
import { formatDate, formatScore } from "@/lib/formatters";
import { ExternalLink, Award } from "lucide-react";
import type { ModelBenchmarkScoreDto } from "@/types/api";

interface ModelBenchmarksProps {
  benchmarks: ModelBenchmarkScoreDto[];
}

export function ModelBenchmarks({ benchmarks }: ModelBenchmarksProps) {
  if (!benchmarks || benchmarks.length === 0) {
    return (
      <div className="py-12 px-4 border border-border border-dashed rounded-[16px] text-center select-none bg-surface/20">
        <Award className="w-8 h-8 text-muted/40 mx-auto mb-2" />
        <h4 className="text-sm font-medium text-text mb-1">
          No cited benchmark data for this model yet
        </h4>
        <p className="text-xs text-muted max-w-sm mx-auto font-sans">
          OneAtlas maintains a strict citation policy and only publishes benchmark
          results backed by public evaluations and reproducible methodology.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benchmarks.map((b) => {
          const score = b.score;
          const avg = b.categoryAverage;
          const unit = b.benchmark.unit || "%";
          const delta = Math.round((score - avg) * 10) / 10;
          const rankText = `#${b.rank}`;

          return (
            <div
              key={b.benchmark.id}
              className="bg-surface border border-border rounded-[14px] p-5 space-y-3.5 shadow-xs"
            >
              {/* Header: Benchmark Name, Category, External Link */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-text">
                      {b.benchmark.name}
                    </h4>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-sm bg-surface-raised border border-border text-muted">
                      {b.benchmark.category}
                    </span>
                  </div>
                  {b.benchmark.description && (
                    <p className="text-xs text-muted mt-1 font-sans line-clamp-1">
                      {b.benchmark.description}
                    </p>
                  )}
                </div>

                {b.sourceUrl && (
                  <a
                    href={b.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-muted hover:text-text rounded-md hover:bg-surface-raised transition-colors shrink-0"
                    title="View cited evaluation source"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Score Metric & Rank */}
              <div className="flex items-end justify-between font-mono">
                <div>
                  <div className="text-2xl font-bold text-text tabular-nums">
                    {formatScore(score)}
                    <span className="text-xs font-normal text-muted ml-0.5">{unit}</span>
                  </div>
                  <div className="text-[11px] text-muted">
                    Category average: {avg}{unit}{" "}
                    <span
                      className={
                        delta >= 0 ? "text-[#8fc49a] font-medium" : "text-accent-warn"
                      }
                    >
                      ({delta >= 0 ? `+${delta}` : delta})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-raised border border-border text-text tabular-nums">
                    Rank {rankText}
                  </span>
                  {b.evaluatedAt && (
                    <div className="text-[10px] text-subtle mt-1">
                      {formatDate(b.evaluatedAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Comparative Progress Bar */}
              <div className="space-y-1">
                <div className="relative w-full h-2.5 bg-surface-raised rounded-full overflow-hidden border border-border">
                  {/* Model Bar */}
                  <div
                    className="h-full bg-[#8fc49a] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                  {/* Category Average Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-text z-10 shadow-xs"
                    style={{ left: `${Math.min(100, Math.max(0, avg))}%` }}
                    title={`Category average: ${avg}${unit}`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-subtle">
                  <span>0{unit}</span>
                  <span>100{unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
