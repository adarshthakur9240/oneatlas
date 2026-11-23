// src/server/services/compare.ts
// Multi-model comparison and dynamic preset generation

import { prisma } from "@/lib/prisma";
import { NotFoundError, BadRequestError } from "@/lib/api-response";
import { getModelBySlug, toSummaryDto, LISTABLE_WHERE } from "./models";
import type {
  CompareResultDto,
  CompareWinnersDto,
  ComparePresetDto,
  ModelDetailDto,
} from "@/types/api";

export async function compareModels(slugs: string[]): Promise<CompareResultDto> {
  const dedupedSlugs = Array.from(new Set(slugs));
  if (dedupedSlugs.length < 2 || dedupedSlugs.length > 4) {
    throw new BadRequestError("Comparison requires between 2 and 4 unique model slugs");
  }

  // Load models in parallel
  const results = await Promise.allSettled(
    dedupedSlugs.map((slug) => getModelBySlug(slug))
  );

  const missingSlugs: string[] = [];
  const models: ModelDetailDto[] = [];

  results.forEach((res, idx) => {
    if (res.status === "fulfilled") {
      models.push(res.value);
    } else {
      missingSlugs.push(dedupedSlugs[idx]!);
    }
  });

  if (missingSlugs.length > 0) {
    throw new NotFoundError(
      `The following models were not found: ${missingSlugs.join(", ")}`
    );
  }

  // Compute Winners (ties return all tied slugs)
  function findMinWinners(
    getter: (m: ModelDetailDto) => number | null
  ): string[] {
    let minVal: number | null = null;
    const tied: string[] = [];
    for (const m of models) {
      const v = getter(m);
      if (v === null || isNaN(v)) continue;
      if (minVal === null || v < minVal) {
        minVal = v;
        tied.length = 0;
        tied.push(m.slug);
      } else if (v === minVal) {
        tied.push(m.slug);
      }
    }
    return tied;
  }

  function findMaxWinners(
    getter: (m: ModelDetailDto) => number | null
  ): string[] {
    let maxVal: number | null = null;
    const tied: string[] = [];
    for (const m of models) {
      const v = getter(m);
      if (v === null || isNaN(v)) continue;
      if (maxVal === null || v > maxVal) {
        maxVal = v;
        tied.length = 0;
        tied.push(m.slug);
      } else if (v === maxVal) {
        tied.push(m.slug);
      }
    }
    return tied;
  }

  const cheapestInput = findMinWinners((m) => m.minInputPrice);
  const cheapestOutput = findMinWinners((m) => m.minOutputPrice);
  const cheapestBlended = findMinWinners((m) => m.blendedPrice);
  const largestContext = findMaxWinners((m) => m.contextWindow);
  const largestMaxOutput = findMaxWinners((m) => m.maxOutputTokens);

  // Provider metrics
  const fastestThroughput = findMaxWinners((m) => {
    const tps = m.providers
      .map((p) => p.throughputP50Tps)
      .filter((t): t is number => t !== null && !isNaN(t));
    return tps.length > 0 ? Math.max(...tps) : null;
  });

  const highestUptime = findMaxWinners((m) => {
    const uptimes = m.providers
      .map((p) => p.uptimePct)
      .filter((u): u is number => u !== null && !isNaN(u));
    return uptimes.length > 0 ? Math.max(...uptimes) : null;
  });

  // Benchmark winners per benchmark slug
  const allBenchmarkSlugs = Array.from(
    new Set(models.flatMap((m) => m.benchmarks.map((b) => b.benchmark.slug)))
  );

  const benchmarkWinners: Record<string, string[]> = {};
  for (const bSlug of allBenchmarkSlugs) {
    let maxScore: number | null = null;
    const tied: string[] = [];
    for (const m of models) {
      const bScore = m.benchmarks.find((b) => b.benchmark.slug === bSlug)?.score;
      if (bScore === undefined || bScore === null || isNaN(bScore)) continue;
      if (maxScore === null || bScore > maxScore) {
        maxScore = bScore;
        tied.length = 0;
        tied.push(m.slug);
      } else if (bScore === maxScore) {
        tied.push(m.slug);
      }
    }
    benchmarkWinners[bSlug] = tied;
  }

  // Intelligence winner: only crown winner among models with the same scoreBasis
  const scoredModels = models.filter(
    (m) => m.intelligenceScore !== null && m.scoreBasis !== null
  );
  const firstBasis = scoredModels[0]?.scoreBasis ?? null;
  const sameBasis =
    scoredModels.length > 0 &&
    scoredModels.every((m) => m.scoreBasis === firstBasis);

  const highestIntelligence = sameBasis
    ? findMaxWinners((m) => m.intelligenceScore)
    : [];

  const winners: CompareWinnersDto = {
    cheapestInput,
    cheapestOutput,
    cheapestBlended,
    largestContext,
    largestMaxOutput,
    fastestThroughput,
    highestUptime,
    highestIntelligence,
    sameBasis,
    scoreBasis: sameBasis ? firstBasis : null,
    benchmarks: benchmarkWinners,
  };

  return {
    models,
    winners,
  };
}

export async function getComparePresets(): Promise<ComparePresetDto[]> {
  const [flagships, coders, budgets, openWeights] = await Promise.all([
    // 1. "Flagship battle" (top 3 FLAGSHIP/REASONING by compositeScore)
    prisma.model.findMany({
      where: {
        ...LISTABLE_WHERE,
        modelType: { in: ["FLAGSHIP", "REASONING"] },
        compositeScore: { not: null },
      },
      orderBy: [{ compositeScore: "desc" }, { id: "asc" }],
      take: 3,
      include: {
        lab: { select: { slug: true, name: true, logoUrl: true } },
      },
    }),

    // 2. "Coding kings" (top 3 by codingScore)
    prisma.model.findMany({
      where: {
        ...LISTABLE_WHERE,
        codingScore: { not: null },
      },
      orderBy: [{ codingScore: "desc" }, { id: "asc" }],
      take: 3,
      include: {
        lab: { select: { slug: true, name: true, logoUrl: true } },
      },
    }),

    // 3. "Budget picks" (3 cheapest models with intelligenceScore >= 60)
    prisma.model.findMany({
      where: {
        ...LISTABLE_WHERE,
        intelligenceScore: { gte: 60 },
        blendedPrice: { not: null, gt: 0 },
      },
      orderBy: [{ blendedPrice: "asc" }, { id: "asc" }],
      take: 3,
      include: {
        lab: { select: { slug: true, name: true, logoUrl: true } },
      },
    }),

    // 4. "Open-weights leaders" (top 3 isOpenWeights by compositeScore)
    prisma.model.findMany({
      where: {
        ...LISTABLE_WHERE,
        isOpenWeights: true,
        compositeScore: { not: null },
      },
      orderBy: [{ compositeScore: "desc" }, { id: "asc" }],
      take: 3,
      include: {
        lab: { select: { slug: true, name: true, logoUrl: true } },
      },
    }),
  ]);

  const presetsRaw: Array<{
    id: string;
    name: string;
    description: string;
    rows: typeof flagships;
  }> = [
    {
      id: "flagship-battle",
      name: "Flagship battle",
      description: "Top-tier flagship and reasoning models compared head-to-head",
      rows: flagships,
    },
    {
      id: "coding-kings",
      name: "Coding kings",
      description: "Top performers on verified SWE-bench and LiveCodeBench software engineering tasks",
      rows: coders,
    },
    {
      id: "budget-picks",
      name: "Budget picks",
      description: "Highest intelligence-per-dollar models with intelligenceScore >= 60",
      rows: budgets,
    },
    {
      id: "open-weights-leaders",
      name: "Open-weights leaders",
      description: "Top open-weight weights by composite intelligence benchmark scores",
      rows: openWeights,
    },
  ];

  return presetsRaw
    .filter((p) => p.rows.length >= 2)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      modelSlugs: p.rows.map((r) => r.slug),
      models: p.rows.map(toSummaryDto),
    }));
}
