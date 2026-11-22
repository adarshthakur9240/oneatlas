// src/server/services/benchmarks.ts
// Benchmark definitions, coverage metrics, and top performer summaries

import { prisma } from "@/lib/prisma";
import { toSummaryDto, LISTABLE_WHERE } from "./models";
import type { BenchmarkDefinitionDto } from "@/types/api";

export async function listBenchmarks(): Promise<BenchmarkDefinitionDto[]> {
  const [benchmarks, allScores] = await Promise.all([
    prisma.benchmark.findMany({
      orderBy: { slug: "asc" },
    }),
    prisma.benchmarkScore.findMany({
      where: {
        model: LISTABLE_WHERE,
      },
      orderBy: [{ score: "desc" }, { modelId: "asc" }],
      include: {
        model: {
          include: {
            lab: { select: { slug: true, name: true, logoUrl: true } },
          },
        },
      },
    }),
  ]);

  const scoresByBenchmark = new Map<string, typeof allScores>();
  for (const s of allScores) {
    let list = scoresByBenchmark.get(s.benchmarkId);
    if (!list) {
      list = [];
      scoresByBenchmark.set(s.benchmarkId, list);
    }
    list.push(s);
  }

  return benchmarks.map((b) => {
    const scores = scoresByBenchmark.get(b.id) ?? [];
    const coverage = scores.length;
    const topScores = scores.slice(0, 5);

    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      category: b.category,
      unit: b.unit,
      description: b.description,
      coverage,
      topModels: topScores.map((ts, idx) => ({
        rank: idx + 1,
        model: toSummaryDto(ts.model),
        score: ts.score,
      })),
    };
  });
}
