// src/server/services/filters.ts
// Faceted counts and ranges across listable models for catalog filtering

import { prisma } from "@/lib/prisma";
import { LISTABLE_WHERE } from "./models";
import type { FilterFacetsDto, ModelType } from "@/types/api";

export async function getFilterFacets(): Promise<FilterFacetsDto> {
  const [
    totalListableModels,
    labsData,
    providersData,
    typesData,
    capRows,
    imageCount,
    audioCount,
    fileCount,
    openWeightsCount,
    freeCount,
    gte128k,
    gte200k,
    gte1m,
    priceAgg,
  ] = await Promise.all([
    prisma.model.count({ where: LISTABLE_WHERE }),

    prisma.lab.findMany({
      where: { models: { some: LISTABLE_WHERE } },
      select: {
        slug: true,
        name: true,
        _count: { select: { models: { where: LISTABLE_WHERE } } },
      },
      orderBy: { name: "asc" },
    }),

    prisma.provider.findMany({
      where: {
        modelProviders: {
          some: {
            isAvailable: true,
            model: LISTABLE_WHERE,
          },
        },
      },
      select: {
        slug: true,
        name: true,
        modelProviders: {
          where: {
            isAvailable: true,
            model: LISTABLE_WHERE,
          },
          select: { modelId: true },
          distinct: ["modelId"],
        },
      },
      orderBy: { name: "asc" },
    }),

    prisma.model.groupBy({
      by: ["modelType"],
      where: LISTABLE_WHERE,
      _count: true,
      orderBy: { modelType: "asc" },
    }),

    prisma.$queryRaw<Array<{ capability: string; count: bigint }>>`
      SELECT unnest(capabilities) as capability, COUNT(*)::bigint as count
      FROM "Model"
      WHERE "isDeprecated" = false AND "providerCount" >= 1
      GROUP BY capability
      ORDER BY count DESC;
    `,

    prisma.model.count({
      where: {
        ...LISTABLE_WHERE,
        capabilities: { has: "vision" },
      },
    }),

    prisma.model.count({
      where: {
        ...LISTABLE_WHERE,
        capabilities: { has: "audio_input" },
      },
    }),

    prisma.model.count({
      where: {
        ...LISTABLE_WHERE,
        capabilities: { has: "files" },
      },
    }),

    prisma.model.count({
      where: {
        ...LISTABLE_WHERE,
        isOpenWeights: true,
      },
    }),

    prisma.model.count({
      where: {
        ...LISTABLE_WHERE,
        OR: [
          { AND: [{ minInputPrice: 0 }, { minOutputPrice: 0 }] },
          { hasFreeVariant: true },
        ],
      },
    }),

    prisma.model.count({
      where: { ...LISTABLE_WHERE, contextWindow: { gte: 128000 } },
    }),

    prisma.model.count({
      where: { ...LISTABLE_WHERE, contextWindow: { gte: 200000 } },
    }),

    prisma.model.count({
      where: { ...LISTABLE_WHERE, contextWindow: { gte: 1000000 } },
    }),

    prisma.model.aggregate({
      where: {
        ...LISTABLE_WHERE,
        blendedPrice: { not: null },
      },
      _min: { blendedPrice: true },
      _max: { blendedPrice: true },
    }),
  ]);

  const labs = labsData.map((l) => ({
    slug: l.slug,
    name: l.name,
    count: l._count.models,
  }));

  const providers = providersData.map((p) => ({
    slug: p.slug,
    name: p.name,
    count: p.modelProviders.length,
  }));

  const types = typesData.map((t) => ({
    type: t.modelType as ModelType,
    count: t._count,
  }));

  const capabilities = capRows.map((r) => ({
    capability: r.capability,
    count: Number(r.count),
  }));

  const inputModalities = [
    { modality: "text", count: totalListableModels },
    { modality: "image", count: imageCount },
    { modality: "audio", count: audioCount },
    { modality: "file", count: fileCount },
  ].filter((m) => m.count > 0);

  return {
    labs,
    providers,
    types,
    capabilities,
    inputModalities,
    openWeightsCount,
    freeCount,
    contextBuckets: {
      gte128k,
      gte200k,
      gte1m,
    },
    priceRange: {
      min: priceAgg._min.blendedPrice ?? 0,
      max: priceAgg._max.blendedPrice ?? 0,
    },
    totalListableModels,
  };
}
