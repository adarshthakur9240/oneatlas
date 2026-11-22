// src/server/services/labs.ts
// AI research lab discovery, portfolio profiles, and model release timelines

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/api-response";
import { toSummaryDto, LISTABLE_WHERE } from "./models";
import type {
  LabListItemDto,
  LabWithModelsDto,
} from "@/types/api";

export async function listLabs(): Promise<LabListItemDto[]> {
  const labs = await prisma.lab.findMany({
    orderBy: { name: "asc" },
    include: {
      models: {
        where: LISTABLE_WHERE,
        orderBy: [{ compositeScore: "desc" }, { releaseDate: "desc" }],
        include: {
          lab: { select: { slug: true, name: true, logoUrl: true } },
        },
      },
    },
  });

  return labs.map((lab) => {
    const listableModels = lab.models;
    const modelCount = listableModels.length;
    const openWeightsCount = listableModels.filter((m) => m.isOpenWeights).length;

    // Flagship: highest compositeScore else latest release
    const flagshipRaw = listableModels[0] ? toSummaryDto(listableModels[0]) : null;

    const scoredModels = listableModels.filter((m) => m.compositeScore !== null);
    const avgCompositeScore =
      scoredModels.length > 0
        ? Math.round(
            (scoredModels.reduce((acc, m) => acc + (m.compositeScore ?? 0), 0) /
              scoredModels.length) *
              10
          ) / 10
        : null;

    // Latest release
    let latestRelease: string | null = null;
    const dates = listableModels
      .map((m) => m.releaseDate)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime());

    if (dates[0]) {
      latestRelease = dates[0].toISOString();
    }

    return {
      id: lab.id,
      slug: lab.slug,
      name: lab.name,
      description: lab.description,
      website: lab.website,
      country: lab.country,
      foundedYear: lab.foundedYear,
      logoUrl: lab.logoUrl,
      isOpenFirst: lab.isOpenFirst,
      createdAt: lab.createdAt.toISOString(),
      updatedAt: lab.updatedAt.toISOString(),
      modelCount,
      openWeightsCount,
      flagship: flagshipRaw,
      avgCompositeScore,
      latestRelease,
    };
  });
}

export async function getLabBySlug(slug: string): Promise<LabWithModelsDto> {
  const lab = await prisma.lab.findUnique({
    where: { slug },
    include: {
      models: {
        where: LISTABLE_WHERE,
        orderBy: [{ releaseDate: "desc" }, { id: "asc" }],
        include: {
          lab: { select: { slug: true, name: true, logoUrl: true } },
        },
      },
    },
  });

  if (!lab) {
    throw new NotFoundError(`Lab with slug '${slug}' not found`);
  }

  // Build release timeline grouped by month "YYYY-MM"
  const timelineMap = new Map<
    string,
    { count: number; models: Array<{ slug: string; name: string }> }
  >();

  for (const m of lab.models) {
    const monthKey = m.releaseDate
      ? m.releaseDate.toISOString().slice(0, 7)
      : "Unknown";
    if (!timelineMap.has(monthKey)) {
      timelineMap.set(monthKey, { count: 0, models: [] });
    }
    const entry = timelineMap.get(monthKey)!;
    entry.count++;
    entry.models.push({ slug: m.slug, name: m.name });
  }

  const releaseTimeline = Array.from(timelineMap.entries())
    .map(([month, data]) => ({
      month,
      count: data.count,
      models: data.models,
    }))
    .sort((a, b) => (b.month > a.month ? 1 : -1));

  return {
    id: lab.id,
    slug: lab.slug,
    name: lab.name,
    description: lab.description,
    website: lab.website,
    country: lab.country,
    foundedYear: lab.foundedYear,
    logoUrl: lab.logoUrl,
    isOpenFirst: lab.isOpenFirst,
    createdAt: lab.createdAt.toISOString(),
    updatedAt: lab.updatedAt.toISOString(),
    models: lab.models.map(toSummaryDto),
    releaseTimeline,
  };
}
