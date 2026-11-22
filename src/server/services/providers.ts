// src/server/services/providers.ts
// Inference provider listings, hosted models, and endpoint pricing profiles

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/api-response";
import { toSummaryDto, LISTABLE_WHERE } from "./models";
import type {
  ProviderListItemDto,
  ProviderDetailDto,
} from "@/types/api";

export async function listProviders(): Promise<ProviderListItemDto[]> {
  const providers = await prisma.provider.findMany({
    orderBy: { name: "asc" },
    include: {
      modelProviders: {
        where: {
          isAvailable: true,
          model: LISTABLE_WHERE,
        },
        include: {
          model: {
            select: {
              id: true,
              blendedPrice: true,
              cheapestProviderSlug: true,
            },
          },
        },
      },
    },
  });

  return providers.map((p) => {
    // Distinct hosted listable models
    const distinctModelIds = new Set(p.modelProviders.map((mp) => mp.model.id));
    const hostedModelCount = distinctModelIds.size;

    // Starting price (minimum blendedPrice among hosted models)
    let startingPrice: number | null = null;
    for (const mp of p.modelProviders) {
      const bp = mp.model.blendedPrice;
      if (bp !== null && bp > 0) {
        if (startingPrice === null || bp < startingPrice) {
          startingPrice = bp;
        }
      }
    }

    // Count of models where this provider is the cheapest provider
    const cheapestCount = new Set(
      p.modelProviders
        .filter((mp) => mp.model.cheapestProviderSlug === p.slug)
        .map((mp) => mp.model.id)
    ).size;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      website: p.website,
      logoUrl: p.logoUrl,
      hostedModelCount,
      avgLatencyMs: p.avgLatencyMs,
      avgThroughputTps: p.avgThroughputTps,
      uptimePct: p.uptimePct,
      startingPrice,
      cheapestCount,
    };
  });
}

export async function getProviderBySlug(
  slug: string
): Promise<ProviderDetailDto> {
  const provider = await prisma.provider.findUnique({
    where: { slug },
    include: {
      modelProviders: {
        where: {
          model: LISTABLE_WHERE,
        },
        include: {
          model: {
            include: {
              lab: { select: { slug: true, name: true, logoUrl: true } },
            },
          },
        },
      },
    },
  });

  if (!provider) {
    throw new NotFoundError(`Provider with slug '${slug}' not found`);
  }

  const distinctModelIds = new Set(
    provider.modelProviders.map((mp) => mp.model.id)
  );
  const hostedModelCount = distinctModelIds.size;

  let startingPrice: number | null = null;
  for (const mp of provider.modelProviders) {
    const bp = mp.model.blendedPrice;
    if (bp !== null && bp > 0) {
      if (startingPrice === null || bp < startingPrice) {
        startingPrice = bp;
      }
    }
  }

  const cheapestCount = new Set(
    provider.modelProviders
      .filter((mp) => mp.model.cheapestProviderSlug === provider.slug)
      .map((mp) => mp.model.id)
  ).size;

  const hostedModels = provider.modelProviders
    .sort((a, b) => {
      const bpa = a.model.blendedPrice ?? Infinity;
      const bpb = b.model.blendedPrice ?? Infinity;
      return bpa - bpb;
    })
    .map((mp) => ({
      model: toSummaryDto(mp.model),
      endpointTag: mp.endpointTag,
      inputPrice: mp.inputPrice,
      outputPrice: mp.outputPrice,
      cacheReadPrice: mp.cacheReadPrice,
      cacheWritePrice: mp.cacheWritePrice,
      quantization: mp.quantization,
      contextWindow: mp.contextWindow,
      maxOutputTokens: mp.maxOutputTokens,
      latencyP50Ms: mp.latencyP50Ms,
      throughputP50Tps: mp.throughputP50Tps,
      uptimePct: mp.uptimePct,
      isAvailable: mp.isAvailable,
    }));

  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    description: provider.description,
    website: provider.website,
    logoUrl: provider.logoUrl,
    hostedModelCount,
    avgLatencyMs: provider.avgLatencyMs,
    avgThroughputTps: provider.avgThroughputTps,
    uptimePct: provider.uptimePct,
    startingPrice,
    cheapestCount,
    hostedModels,
  };
}
