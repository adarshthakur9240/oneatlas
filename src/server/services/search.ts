// src/server/services/search.ts
// Parallel omni-search for models, labs, and providers

import { prisma } from "@/lib/prisma";
import { LISTABLE_WHERE } from "./models";
import type { SearchResultDto, ModelType } from "@/types/api";

export async function searchAll(query: string): Promise<SearchResultDto> {
  const q = query.trim();
  if (!q) {
    return {
      models: [],
      labs: [],
      providers: [],
    };
  }

  const qLower = q.toLowerCase();

  const [modelsRaw, labsRaw, providersRaw] = await Promise.all([
    // Top models (listable, search name, slug, sourceId)
    prisma.model.findMany({
      where: {
        ...LISTABLE_WHERE,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { sourceId: { contains: q, mode: "insensitive" } },
          { lab: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      take: 12, // take extra to sort prefix matches first
      select: {
        id: true,
        slug: true,
        name: true,
        modelType: true,
        blendedPrice: true,
        compositeScore: true,
        lab: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    }),

    // Top 3 labs
    prisma.lab.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 3,
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        _count: {
          select: {
            models: { where: LISTABLE_WHERE },
          },
        },
      },
      orderBy: { name: "asc" },
    }),

    // Top 3 providers
    prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 3,
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        modelProviders: {
          where: { isAvailable: true, model: LISTABLE_WHERE },
          select: { modelId: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Sort model prefix matches first, then take 6
  const models = modelsRaw
    .sort((a, b) => {
      const aPrefix =
        a.name.toLowerCase().startsWith(qLower) ||
        a.slug.toLowerCase().startsWith(qLower);
      const bPrefix =
        b.name.toLowerCase().startsWith(qLower) ||
        b.slug.toLowerCase().startsWith(qLower);
      if (aPrefix && !bPrefix) return -1;
      if (!aPrefix && bPrefix) return 1;
      return 0;
    })
    .slice(0, 6)
    .map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      modelType: m.modelType as ModelType,
      blendedPrice: m.blendedPrice,
      compositeScore: m.compositeScore,
      lab: {
        slug: m.lab.slug,
        name: m.lab.name,
      },
    }));

  const labs = labsRaw.map((l) => ({
    id: l.id,
    slug: l.slug,
    name: l.name,
    logoUrl: l.logoUrl,
    modelCount: l._count.models,
  }));

  const providers = providersRaw.map((p) => {
    const distinctHosted = new Set(p.modelProviders.map((mp) => mp.modelId)).size;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      logoUrl: p.logoUrl,
      hostedModelCount: distinctHosted,
    };
  });

  return {
    models,
    labs,
    providers,
  };
}
