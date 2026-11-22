// src/server/services/models.ts
// Business logic and database operations for models
// Reusable by both API route handlers and React Server Components

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/api-response";
import { blendedPrice as calculateBlendedPrice } from "@/lib/pricing";
import type {
  ModelSummaryDto,
  ModelDetailDto,
  ModelProviderDto,
  ModelBenchmarkScoreDto,
  PaginationMeta,
  ModelType,
} from "@/types/api";
import type { ModelsQuery } from "@/lib/validators";
import { Prisma } from "@prisma/client";

/**
 * Definition of a "listable" model in OneAtlas:
 * A model is considered listable if it is not deprecated (!isDeprecated)
 * AND has at least one active, verified provider endpoint (providerCount >= 1).
 * Models with 0 providers or marked deprecated are unserved and hidden by default.
 */
export const LISTABLE_WHERE: Prisma.ModelWhereInput = {
  isDeprecated: false,
  providerCount: { gte: 1 },
};

function deriveModalities(capabilities: string[], modelType: ModelType) {
  const inputs: string[] = ["text"];
  if (capabilities.includes("vision")) inputs.push("image");
  if (capabilities.includes("audio_input")) inputs.push("audio");
  if (capabilities.includes("files")) inputs.push("file");

  const outputs: string[] =
    modelType === "EMBEDDING" ? ["embedding"] : ["text"];

  return { inputs, outputs };
}

function toSummaryDto(m: {
  id: string;
  slug: string;
  sourceId: string;
  name: string;
  description: string;
  modelType: string;
  releaseDate: Date | null;
  isOpenWeights: boolean;
  isDeprecated: boolean;
  hasFreeVariant: boolean;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  capabilities: string[];
  minInputPrice: number | null;
  minOutputPrice: number | null;
  blendedPrice: number | null;
  minCacheReadPrice: number | null;
  cheapestProviderSlug: string | null;
  cheapestProviderName: string | null;
  providerCount: number;
  intelligenceScore: number | null;
  codingScore: number | null;
  compositeScore: number | null;
  lab: {
    slug: string;
    name: string;
    logoUrl?: string | null;
  };
}): ModelSummaryDto {
  const { inputs, outputs } = deriveModalities(
    m.capabilities,
    m.modelType as ModelType
  );
  const isNew = m.releaseDate
    ? Date.now() - m.releaseDate.getTime() <= 14 * 24 * 60 * 60 * 1000
    : false;

  return {
    id: m.id,
    slug: m.slug,
    sourceId: m.sourceId,
    name: m.name,
    descriptionShort: m.description ? m.description.slice(0, 160) : "",
    lab: {
      slug: m.lab.slug,
      name: m.lab.name,
      logoUrl: m.lab.logoUrl ?? null,
    },
    modelType: m.modelType as ModelType,
    releaseDate: m.releaseDate ? m.releaseDate.toISOString() : null,
    isNew,
    isOpenWeights: m.isOpenWeights,
    isDeprecated: m.isDeprecated,
    hasFreeVariant: m.hasFreeVariant,
    contextWindow: m.contextWindow,
    maxOutputTokens: m.maxOutputTokens,
    inputModalities: inputs,
    outputModalities: outputs,
    capabilities: m.capabilities,
    minInputPrice: m.minInputPrice,
    minOutputPrice: m.minOutputPrice,
    blendedPrice: m.blendedPrice,
    minCacheReadPrice: m.minCacheReadPrice,
    cheapestProvider: m.cheapestProviderSlug
      ? {
          slug: m.cheapestProviderSlug,
          name: m.cheapestProviderName ?? m.cheapestProviderSlug,
        }
      : null,
    providerCount: m.providerCount,
    intelligenceScore: m.intelligenceScore,
    codingScore: m.codingScore,
    compositeScore: m.compositeScore,
  };
}

export async function listModels(
  query: ModelsQuery
): Promise<{ models: ModelSummaryDto[]; meta: PaginationMeta }> {
  const where: Prisma.ModelWhereInput = {};

  // 1. Deprecated / Listable filter
  if (query.hideDeprecated) {
    where.isDeprecated = false;
    where.providerCount = { gte: 1 };
  }

  // 2. Text Search (ILIKE on name, slug, sourceId, lab name)
  if (query.q) {
    const q = query.q;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { sourceId: { contains: q, mode: "insensitive" } },
      { lab: { name: { contains: q, mode: "insensitive" } } },
      { lab: { slug: { contains: q, mode: "insensitive" } } },
    ];
  }

  // 3. Labs (csv slugs)
  if (query.lab && query.lab.length > 0) {
    where.lab = { slug: { in: query.lab } };
  }

  // 4. Providers (csv slugs)
  if (query.provider && query.provider.length > 0) {
    where.modelProviders = {
      some: {
        provider: { slug: { in: query.provider } },
        isAvailable: true,
      },
    };
  }

  // 5. Model Type
  if (query.type && query.type.length > 0) {
    where.modelType = { in: query.type };
  }

  // 6. Capability (hasEvery)
  if (query.capability && query.capability.length > 0) {
    where.capabilities = { hasEvery: query.capability };
  }

  // 7. Input Modalities
  if (query.inputModality && query.inputModality.length > 0) {
    const capsNeeded: string[] = [];
    if (query.inputModality.includes("image")) capsNeeded.push("vision");
    if (query.inputModality.includes("audio")) capsNeeded.push("audio_input");
    if (query.inputModality.includes("file")) capsNeeded.push("files");
    if (capsNeeded.length > 0) {
      where.capabilities = {
        ...(where.capabilities ?? {}),
        hasEvery: [
          ...((where.capabilities as Prisma.StringNullableListFilter)
            ?.hasEvery ?? []),
          ...capsNeeded,
        ],
      };
    }
  }

  // 8. Open Weights
  if (query.openWeights !== undefined) {
    where.isOpenWeights = query.openWeights;
  }

  // 9. Free
  if (query.free !== undefined) {
    if (query.free) {
      where.OR = [
        ...(where.OR ?? []),
        { hasFreeVariant: true },
        { minInputPrice: 0, minOutputPrice: 0 },
      ];
    } else {
      where.hasFreeVariant = false;
      where.NOT = { minInputPrice: 0, minOutputPrice: 0 };
    }
  }

  // 10. minContext
  if (query.minContext !== undefined) {
    where.contextWindow = { gte: query.minContext };
  }

  // 11. maxPrice (blendedPrice <= maxPrice)
  if (query.maxPrice !== undefined) {
    where.blendedPrice = { lte: query.maxPrice, not: null };
  }

  // 12. Sorting with NULLS LAST & tiebreaker
  let orderBy: Prisma.ModelOrderByWithRelationInput[] = [];

  switch (query.sort) {
    case "composite_desc":
      orderBy = [
        { compositeScore: { sort: "desc", nulls: "last" } },
        { id: "asc" },
      ];
      break;
    case "intelligence_desc":
      orderBy = [
        { intelligenceScore: { sort: "desc", nulls: "last" } },
        { id: "asc" },
      ];
      break;
    case "coding_desc":
      orderBy = [
        { codingScore: { sort: "desc", nulls: "last" } },
        { id: "asc" },
      ];
      break;
    case "price_asc":
      orderBy = [
        { blendedPrice: { sort: "asc", nulls: "last" } },
        { id: "asc" },
      ];
      break;
    case "price_desc":
      orderBy = [
        { blendedPrice: { sort: "desc", nulls: "last" } },
        { id: "asc" },
      ];
      break;
    case "context_desc":
      orderBy = [
        { contextWindow: { sort: "desc", nulls: "last" } },
        { id: "asc" },
      ];
      break;
    case "context_asc":
      orderBy = [
        { contextWindow: { sort: "asc", nulls: "last" } },
        { id: "asc" },
      ];
      break;
    case "release_asc":
      orderBy = [
        { releaseDate: { sort: "asc", nulls: "last" } },
        { id: "asc" },
      ];
      break;
    case "name_asc":
      orderBy = [{ name: "asc" }, { id: "asc" }];
      break;
    case "providers_desc":
      orderBy = [{ providerCount: "desc" }, { id: "asc" }];
      break;
    case "release_desc":
    default:
      orderBy = [
        { releaseDate: { sort: "desc", nulls: "last" } },
        { id: "asc" },
      ];
      break;
  }

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  // Single query for total count + rows
  const [total, rows] = await Promise.all([
    prisma.model.count({ where }),
    prisma.model.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        lab: {
          select: {
            slug: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    }),
  ]);

  // If search q is present and default release_desc sort, prioritize prefix matches in memory
  let sortedRows = rows;
  if (query.q && query.sort === "release_desc") {
    const qLower = query.q.toLowerCase();
    sortedRows = [...rows].sort((a, b) => {
      const aPrefix =
        a.name.toLowerCase().startsWith(qLower) ||
        a.slug.toLowerCase().startsWith(qLower);
      const bPrefix =
        b.name.toLowerCase().startsWith(qLower) ||
        b.slug.toLowerCase().startsWith(qLower);
      if (aPrefix && !bPrefix) return -1;
      if (!aPrefix && bPrefix) return 1;
      return 0;
    });
  }

  const models = sortedRows.map(toSummaryDto);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    models,
    meta: {
      page,
      limit,
      total,
      totalPages,
      appliedFilters: {
        q: query.q ?? null,
        lab: query.lab?.length ? query.lab : null,
        provider: query.provider?.length ? query.provider : null,
        type: query.type?.length ? query.type : null,
        capability: query.capability?.length ? query.capability : null,
        openWeights: query.openWeights ?? null,
        free: query.free ?? null,
        minContext: query.minContext ?? null,
        maxPrice: query.maxPrice ?? null,
        hideDeprecated: query.hideDeprecated,
        sort: query.sort,
      },
    },
  };
}

export async function getModelBySlug(slug: string): Promise<ModelDetailDto> {
  const model = await prisma.model.findUnique({
    where: { slug },
    include: {
      lab: true,
      modelProviders: {
        include: {
          provider: true,
        },
      },
      benchmarkScores: {
        include: {
          benchmark: true,
        },
      },
    },
  });

  if (!model) {
    throw new NotFoundError(`Model with slug '${slug}' not found`);
  }

  // Compute provider tags: cheapest, fastest, mostReliable
  const availableProviders = model.modelProviders.filter((p) => p.isAvailable);

  let minBlended: number | null = null;
  let maxThroughput: number | null = null;
  let maxUptime: number | null = null;

  for (const p of availableProviders) {
    const bp = calculateBlendedPrice(p.inputPrice, p.outputPrice);
    if (minBlended === null || bp < minBlended) minBlended = bp;
    if (
      p.throughputP50Tps !== null &&
      (maxThroughput === null || p.throughputP50Tps > maxThroughput)
    ) {
      maxThroughput = p.throughputP50Tps;
    }
    if (
      p.uptimePct !== null &&
      (maxUptime === null || p.uptimePct > maxUptime)
    ) {
      maxUptime = p.uptimePct;
    }
  }

  const providersDto: ModelProviderDto[] = model.modelProviders
    .sort((a, b) => {
      const bpa = calculateBlendedPrice(a.inputPrice, a.outputPrice);
      const bpb = calculateBlendedPrice(b.inputPrice, b.outputPrice);
      return bpa - bpb;
    })
    .map((p) => {
      const bp = calculateBlendedPrice(p.inputPrice, p.outputPrice);
      return {
        id: p.id,
        provider: {
          slug: p.provider.slug,
          name: p.provider.name,
          logoUrl: p.provider.logoUrl,
        },
        endpointTag: p.endpointTag,
        inputPrice: p.inputPrice,
        outputPrice: p.outputPrice,
        cacheReadPrice: p.cacheReadPrice,
        cacheWritePrice: p.cacheWritePrice,
        quantization: p.quantization,
        contextWindow: p.contextWindow,
        maxOutputTokens: p.maxOutputTokens,
        latencyP50Ms: p.latencyP50Ms,
        throughputP50Tps: p.throughputP50Tps,
        uptimePct: p.uptimePct,
        isAvailable: p.isAvailable,
        tags: {
          cheapest: minBlended !== null && bp === minBlended,
          fastest:
            maxThroughput !== null &&
            p.throughputP50Tps !== null &&
            p.throughputP50Tps === maxThroughput,
          mostReliable:
            maxUptime !== null &&
            p.uptimePct !== null &&
            p.uptimePct === maxUptime,
        },
      };
    });

  // Compute benchmarks with categoryAverage & rank via single batched query
  const benchmarkIds = model.benchmarkScores.map((bs) => bs.benchmarkId);
  const allScoresForBenchmarks =
    benchmarkIds.length > 0
      ? await prisma.benchmarkScore.findMany({
          where: { benchmarkId: { in: benchmarkIds } },
          select: { benchmarkId: true, score: true },
        })
      : [];

  const scoresByBenchmark = new Map<string, number[]>();
  for (const s of allScoresForBenchmarks) {
    let arr = scoresByBenchmark.get(s.benchmarkId);
    if (!arr) {
      arr = [];
      scoresByBenchmark.set(s.benchmarkId, arr);
    }
    arr.push(s.score);
  }

  const benchmarkScoresDto: ModelBenchmarkScoreDto[] =
    model.benchmarkScores.map((bs) => {
      const scores = scoresByBenchmark.get(bs.benchmarkId) ?? [bs.score];
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg =
        scores.length > 0 ? Math.round((sum / scores.length) * 10) / 10 : 0;
      const rank = scores.filter((s) => s > bs.score).length + 1;

      return {
        benchmark: {
          id: bs.benchmark.id,
          slug: bs.benchmark.slug,
          name: bs.benchmark.name,
          category: bs.benchmark.category,
          unit: bs.benchmark.unit,
          description: bs.benchmark.description,
        },
        score: bs.score,
        isVendorReported: bs.isVendorReported,
        sourceUrl: bs.sourceUrl,
        evaluatedAt: bs.evaluatedAt ? bs.evaluatedAt.toISOString() : null,
        categoryAverage: avg,
        rank,
      };
    });

  // Compute up to 6 related listable models: same lab or same modelType, nearest blendedPrice
  const relatedCandidates = await prisma.model.findMany({
    where: {
      ...LISTABLE_WHERE,
      id: { not: model.id },
      OR: [{ labId: model.labId }, { modelType: model.modelType }],
    },
    take: 12,
    include: {
      lab: {
        select: {
          slug: true,
          name: true,
          logoUrl: true,
        },
      },
    },
  });

  const targetPrice = model.blendedPrice ?? 0;
  const related = relatedCandidates
    .sort((a, b) => {
      const diffA = Math.abs((a.blendedPrice ?? 0) - targetPrice);
      const diffB = Math.abs((b.blendedPrice ?? 0) - targetPrice);
      return diffA - diffB;
    })
    .slice(0, 6)
    .map(toSummaryDto);

  const summary = toSummaryDto(model);

  return {
    ...summary,
    description: model.description,
    license: null,
    parameterCount: null,
    lab: {
      id: model.lab.id,
      slug: model.lab.slug,
      name: model.lab.name,
      description: model.lab.description,
      website: model.lab.website,
      country: model.lab.country,
      foundedYear: model.lab.foundedYear,
      logoUrl: model.lab.logoUrl,
      isOpenFirst: model.lab.isOpenFirst,
      createdAt: model.lab.createdAt.toISOString(),
      updatedAt: model.lab.updatedAt.toISOString(),
    },
    providers: providersDto,
    benchmarks: benchmarkScoresDto,
    related,
  };
}

export { toSummaryDto };
