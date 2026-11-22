// src/server/services/rankings.ts
// Benchmark and model intelligence rankings

import { prisma } from "@/lib/prisma";
import { toSummaryDto, LISTABLE_WHERE } from "./models";
import type { RankingRowDto } from "@/types/api";
import type { RankingsQuery } from "@/lib/validators";
import { Prisma } from "@prisma/client";

export async function getRankings(
  query: RankingsQuery
): Promise<{ rows: RankingRowDto[]; meta: Record<string, unknown> }> {
  const { benchmark, type, openWeights, limit } = query;

  const totalListableModels = await prisma.model.count({
    where: LISTABLE_WHERE,
  });

  const baseModelWhere: Prisma.ModelWhereInput = {
    ...LISTABLE_WHERE,
  };

  if (type && type.length > 0) {
    baseModelWhere.modelType = { in: type };
  }

  if (openWeights !== undefined) {
    baseModelWhere.isOpenWeights = openWeights;
  }

  let rows: RankingRowDto[] = [];
  let scoredModelsCount = 0;

  if (
    benchmark === "composite" ||
    benchmark === "intelligence" ||
    benchmark === "coding"
  ) {
    const scoreField =
      benchmark === "composite"
        ? "compositeScore"
        : benchmark === "intelligence"
        ? "intelligenceScore"
        : "codingScore";

    const where: Prisma.ModelWhereInput = {
      ...baseModelWhere,
      [scoreField]: { not: null },
    };

    const [count, models] = await Promise.all([
      prisma.model.count({ where }),
      prisma.model.findMany({
        where,
        orderBy: [{ [scoreField]: "desc" }, { id: "asc" }],
        take: limit,
        include: {
          lab: { select: { slug: true, name: true, logoUrl: true } },
        },
      }),
    ]);

    scoredModelsCount = count;

    rows = models.map((m, idx) => {
      const score = (m as Record<string, unknown>)[scoreField] as number;
      const isFree =
        m.hasFreeVariant || (m.blendedPrice !== null && m.blendedPrice === 0);
      const valueIndex =
        m.blendedPrice && m.blendedPrice > 0
          ? Math.round((score / m.blendedPrice) * 100) / 100
          : null;

      return {
        rank: idx + 1,
        model: toSummaryDto(m),
        score,
        blendedPrice: m.blendedPrice,
        valueIndex,
        isFree,
        contextWindow: m.contextWindow,
      };
    });
  } else {
    // Specific benchmark slug (e.g. mmlu-pro, gpqa-diamond, swe-bench-verified)
    const benchmarkRecord = await prisma.benchmark.findUnique({
      where: { slug: benchmark },
      select: { id: true, slug: true, name: true, unit: true },
    });

    if (!benchmarkRecord) {
      return {
        rows: [],
        meta: {
          benchmark,
          scoredModels: 0,
          totalListableModels,
        },
      };
    }

    const where: Prisma.BenchmarkScoreWhereInput = {
      benchmarkId: benchmarkRecord.id,
      model: baseModelWhere,
    };

    const [count, scoreEntries] = await Promise.all([
      prisma.benchmarkScore.count({ where }),
      prisma.benchmarkScore.findMany({
        where,
        orderBy: [{ score: "desc" }, { id: "asc" }],
        take: limit,
        include: {
          model: {
            include: {
              lab: { select: { slug: true, name: true, logoUrl: true } },
            },
          },
        },
      }),
    ]);

    scoredModelsCount = count;

    rows = scoreEntries.map((entry, idx) => {
      const m = entry.model;
      const isFree =
        m.hasFreeVariant || (m.blendedPrice !== null && m.blendedPrice === 0);
      const valueIndex =
        m.blendedPrice && m.blendedPrice > 0
          ? Math.round((entry.score / m.blendedPrice) * 100) / 100
          : null;

      return {
        rank: idx + 1,
        model: toSummaryDto(m),
        score: entry.score,
        blendedPrice: m.blendedPrice,
        valueIndex,
        isFree,
        contextWindow: m.contextWindow,
      };
    });
  }

  return {
    rows,
    meta: {
      benchmark,
      scoredModels: scoredModelsCount,
      totalListableModels,
      coveragePct:
        totalListableModels > 0
          ? Math.round((scoredModelsCount / totalListableModels) * 1000) / 10
          : 0,
      limit,
    },
  };
}
