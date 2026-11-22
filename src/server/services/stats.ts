// src/server/services/stats.ts
// Platform aggregates, release activity, and capability coverage for hero stats

import { prisma } from "@/lib/prisma";
import { LISTABLE_WHERE } from "./models";
import type { StatsDto } from "@/types/api";

export async function getStats(): Promise<StatsDto> {
  const [
    totalModels,
    totalLabs,
    totalProviders,
    totalApiListings,
    totalListable,
    toolCallingCount,
    reasoningCount,
    visionCount,
    openWeightsCount,
    latestModel,
    modelsWithRelease,
  ] = await Promise.all([
    prisma.model.count(),
    prisma.lab.count(),
    prisma.provider.count(),
    prisma.modelProvider.count(),
    prisma.model.count({ where: LISTABLE_WHERE }),

    prisma.model.count({
      where: {
        ...LISTABLE_WHERE,
        capabilities: { has: "tool_calling" },
      },
    }),

    prisma.model.count({
      where: {
        ...LISTABLE_WHERE,
        capabilities: { has: "reasoning" },
      },
    }),

    prisma.model.count({
      where: {
        ...LISTABLE_WHERE,
        capabilities: { has: "vision" },
      },
    }),

    prisma.model.count({
      where: {
        ...LISTABLE_WHERE,
        isOpenWeights: true,
      },
    }),

    prisma.model.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),

    prisma.model.findMany({
      where: { releaseDate: { not: null } },
      select: { releaseDate: true },
    }),
  ]);

  // Generate last 12 calendar months in UTC YYYY-MM
  const now = new Date();
  const months: string[] = [];
  const monthCounts: Record<string, number> = {};

  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const key = `${yyyy}-${mm}`;
    months.push(key);
    monthCounts[key] = 0;
  }

  for (const m of modelsWithRelease) {
    if (m.releaseDate) {
      const key = m.releaseDate.toISOString().slice(0, 7);
      if (key in monthCounts) {
        monthCounts[key]++;
      }
    }
  }

  const releasesPerMonth = months.map((month) => ({
    month,
    count: monthCounts[month] ?? 0,
  }));

  const releasesLast12Months = releasesPerMonth.reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  const capabilityCoverage = {
    toolCalling:
      totalListable > 0
        ? Number(((toolCallingCount / totalListable) * 100).toFixed(1))
        : 0,
    reasoning:
      totalListable > 0
        ? Number(((reasoningCount / totalListable) * 100).toFixed(1))
        : 0,
    visionInput:
      totalListable > 0
        ? Number(((visionCount / totalListable) * 100).toFixed(1))
        : 0,
    openWeights:
      totalListable > 0
        ? Number(((openWeightsCount / totalListable) * 100).toFixed(1))
        : 0,
  };

  const updatedAt =
    latestModel?.updatedAt.toISOString() ?? new Date().toISOString();

  return {
    totals: {
      models: totalModels,
      labs: totalLabs,
      providers: totalProviders,
      apiListings: totalApiListings,
    },
    releasesPerMonth,
    releasesLast12Months,
    capabilityCoverage,
    updatedAt,
  };
}
