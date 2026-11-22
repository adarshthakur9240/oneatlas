// prisma/seed/ingest.ts
// OpenRouter catalog + endpoint ingestion — clean production implementation

import { prisma } from "../../src/lib/prisma";
import { perTokenToPerMillion, blendedPrice } from "../../src/lib/pricing";
import {
  deriveSlug,
  deriveProviderSlug,
  deriveLabSlug,
  deriveLabName,
  isOpenWeights,
  deriveModelType,
  deriveCapabilities,
  stripVariantSuffix,
  isFreeVariant,
  shouldSkipModel,
} from "./derive";
import { fetchWithCache, promisePool, ensureCacheDir } from "./fetch";
import {
  CatalogResponseSchema,
  EndpointResponseSchema,
  type CatalogModel,
  type EndpointObject,
} from "./types";

const BASE_URL = "https://openrouter.ai/api/v1";

export interface IngestOptions {
  refresh?: boolean;
  limit?: number;
  apiKey?: string;
}

interface ProviderAccRow {
  slug: string;
  name: string;
  uptimes: number[];
}

type ModelProviderCreate = {
  providerId: string;
  endpointTag: string;
  inputPrice: number;
  outputPrice: number;
  cacheReadPrice: number | null;
  cacheWritePrice: number | null;
  quantization: string | null;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  latencyP50Ms: number | null;
  throughputP50Tps: number | null;
  uptimePct: number | null;
  isAvailable: boolean;
};

export async function ingestCatalog(opts: IngestOptions = {}): Promise<void> {
  ensureCacheDir();
  const apiKey = opts.apiKey ?? process.env.OPENROUTER_API_KEY;

  // ── 1. Fetch catalog ──────────────────────────────────────────────────────
  console.log("📡 Fetching OpenRouter catalog...");
  const rawCatalog = await fetchWithCache(`${BASE_URL}/models`, {
    refresh: opts.refresh,
    apiKey,
  });

  const catalog = CatalogResponseSchema.parse(rawCatalog);
  console.log(`✅ Catalog: ${catalog.data.length} total models`);

  // ── 2. Filter invalid models ──────────────────────────────────────────────
  const validModels: CatalogModel[] = [];
  let skippedCount = 0;
  for (const m of catalog.data) {
    if (shouldSkipModel(m)) {
      skippedCount++;
    } else {
      validModels.push(m);
    }
  }
  console.log(`⏭️  Skipped ${skippedCount} dynamic/pseudo models`);

  // ── 3. Collect free-variant info & deduplicate ────────────────────────────
  const freeVariantBaseIds = new Set<string>();
  for (const m of validModels) {
    if (isFreeVariant(m.id)) {
      freeVariantBaseIds.add(stripVariantSuffix(m.id));
    }
  }

  // Build dedup set: keep base models; keep variants only if no base exists
  const modelsToIngest: CatalogModel[] = [];
  const seenBaseIds = new Set<string>();
  const validIds = new Set(validModels.map((m) => m.id));

  for (const m of validModels) {
    const baseId = stripVariantSuffix(m.id);
    if (m.id === baseId) {
      // This is a base model
      seenBaseIds.add(baseId);
      modelsToIngest.push(m);
    } else {
      // This is a variant — keep only if base doesn't exist in catalog
      if (!seenBaseIds.has(baseId) && !validIds.has(baseId)) {
        seenBaseIds.add(baseId);
        modelsToIngest.push({ ...m, id: baseId });
      }
    }
  }

  const toProcess = opts.limit
    ? modelsToIngest.slice(0, opts.limit)
    : modelsToIngest;
  console.log(
    `🔄 Processing ${toProcess.length} unique models (after dedup from ${modelsToIngest.length})`
  );

  // ── 4. Upsert labs ────────────────────────────────────────────────────────
  const labSlugs = new Set(toProcess.map((m) => deriveLabSlug(m.id)));
  console.log(`🏢 Upserting ${labSlugs.size} labs...`);
  for (const slug of labSlugs) {
    await prisma.lab.upsert({
      where: { slug },
      update: { name: deriveLabName(slug) },
      create: { slug, name: deriveLabName(slug) },
    });
  }

  // ── 5. Fetch endpoints concurrently ──────────────────────────────────────
  console.log(
    `🔗 Fetching endpoints for ${toProcess.length} models (concurrency: 4)...`
  );
  const endpointMap = new Map<string, EndpointObject[]>();
  let epFetched = 0;

  await promisePool(toProcess, 4, async (model) => {
    const slashIdx = model.id.indexOf("/");
    if (slashIdx === -1) {
      endpointMap.set(model.id, []);
      return;
    }
    const author = model.id.slice(0, slashIdx);
    const modelSlugRaw = model.id.slice(slashIdx + 1);
    // Strip variant suffix for the API path (e.g. :free, :beta)
    const modelSlugClean = stripVariantSuffix(modelSlugRaw);
    const url = `${BASE_URL}/models/${author}/${modelSlugClean}/endpoints`;

    try {
      const raw = await fetchWithCache(url, { refresh: opts.refresh, apiKey });
      const parsed = EndpointResponseSchema.parse(raw);
      endpointMap.set(model.id, parsed.data.endpoints);
    } catch {
      endpointMap.set(model.id, []);
    }

    epFetched++;
    if (epFetched % 50 === 0) {
      process.stdout.write(
        `  ... ${epFetched}/${toProcess.length} endpoint fetches done\r`
      );
    }
  });
  console.log(
    `✅ Endpoints fetched for ${toProcess.length} models              `
  );

  // ── 6. Accumulate provider data from all endpoints ────────────────────────
  const providerAcc = new Map<string, ProviderAccRow>();

  for (const model of toProcess) {
    const endpoints = endpointMap.get(model.id) ?? [];
    for (const ep of endpoints) {
      const pSlug = deriveProviderSlug(ep.provider_name);
      if (!providerAcc.has(pSlug)) {
        providerAcc.set(pSlug, {
          slug: pSlug,
          name: ep.provider_name,
          uptimes: [],
        });
      }
      const acc = providerAcc.get(pSlug)!;
      if (typeof ep.uptime_last_30m === "number") {
        acc.uptimes.push(ep.uptime_last_30m);
      }
    }
  }

  // ── 7. Upsert providers ───────────────────────────────────────────────────
  console.log(`🔌 Upserting ${providerAcc.size} providers...`);
  for (const [, prov] of providerAcc) {
    const uptimePct =
      prov.uptimes.length > 0
        ? prov.uptimes.reduce((a, b) => a + b, 0) / prov.uptimes.length
        : null;

    await prisma.provider.upsert({
      where: { slug: prov.slug },
      update: { name: prov.name, uptimePct },
      create: {
        slug: prov.slug,
        name: prov.name,
        avgLatencyMs: null,
        avgThroughputTps: null,
        uptimePct,
      },
    });
  }

  // ── 8. Build providerId lookup (slug -> DB id) ────────────────────────────
  const providerSlugToId = new Map<string, { id: string; name: string }>();
  const allProviders = await prisma.provider.findMany({
    select: { id: true, slug: true, name: true },
  });
  for (const p of allProviders) {
    providerSlugToId.set(p.slug, { id: p.id, name: p.name });
  }

  // ── 9. Record existing sourceIds for deprecation marking ─────────────────
  const existingSourceIds = new Set(
    (await prisma.model.findMany({ select: { sourceId: true } })).map(
      (m) => m.sourceId
    )
  );

  // ── 10. Upsert models + ModelProvider rows ────────────────────────────────
  console.log(`💾 Upserting ${toProcess.length} models...`);
  let modelsUpserted = 0;

  for (const model of toProcess) {
    const endpoints = endpointMap.get(model.id) ?? [];
    const labSlug = deriveLabSlug(model.id);
    const lab = await prisma.lab.findUniqueOrThrow({ where: { slug: labSlug } });

    const hasCacheRead = endpoints.some((ep) => !!ep.pricing.input_cache_read);
    const hasFreeVar = freeVariantBaseIds.has(model.id);

    // Build ModelProvider create rows
    const mpRows: ModelProviderCreate[] = [];

    for (const ep of endpoints) {
      const inputPrice = perTokenToPerMillion(ep.pricing.prompt ?? "0");
      const outputPrice = perTokenToPerMillion(ep.pricing.completion ?? "0");
      if (inputPrice === null || outputPrice === null) continue;

      const pSlug = deriveProviderSlug(ep.provider_name);
      const provEntry = providerSlugToId.get(pSlug);
      if (!provEntry) continue;

      const cacheReadPrice = ep.pricing.input_cache_read
        ? perTokenToPerMillion(ep.pricing.input_cache_read)
        : null;
      const cacheWritePrice = ep.pricing.input_cache_write
        ? perTokenToPerMillion(ep.pricing.input_cache_write)
        : null;

      // status: 0 = active/available; undefined = assume available
      const isAvailable = ep.status === 0 || ep.status === undefined;

      mpRows.push({
        providerId: provEntry.id,
        endpointTag: ep.tag ?? "",
        inputPrice,
        outputPrice,
        cacheReadPrice,
        cacheWritePrice,
        quantization: ep.quantization ?? null,
        contextWindow: ep.context_length ?? null,
        maxOutputTokens: ep.max_completion_tokens ?? null,
        latencyP50Ms: null, // live API returns null for latency objects
        throughputP50Tps: null,
        uptimePct:
          typeof ep.uptime_last_30m === "number" ? ep.uptime_last_30m : null,
        isAvailable,
      });
    }

    // Derive denormalized price summary from available rows
    const availableRows = mpRows.filter((r) => r.isAvailable);
    let minInputPrice: number | null = null;
    let minOutputPrice: number | null = null;
    let minBlendedPrice: number | null = null;
    let minCacheReadPrice: number | null = null;
    let cheapestProviderSlug: string | null = null;
    let cheapestProviderName: string | null = null;
    const providerCount = new Set(mpRows.map((r) => r.providerId)).size;

    for (const row of availableRows) {
      const bp = blendedPrice(row.inputPrice, row.outputPrice);
      if (minBlendedPrice === null || bp < minBlendedPrice) {
        minBlendedPrice = bp;
        minInputPrice = row.inputPrice;
        minOutputPrice = row.outputPrice;
        // Look up provider slug for this row's providerId
        for (const [slug, entry] of providerSlugToId) {
          if (entry.id === row.providerId) {
            cheapestProviderSlug = slug;
            cheapestProviderName = entry.name;
            break;
          }
        }
      }
      if (
        row.cacheReadPrice !== null &&
        (minCacheReadPrice === null || row.cacheReadPrice < minCacheReadPrice)
      ) {
        minCacheReadPrice = row.cacheReadPrice;
      }
    }

    const slug = deriveSlug(model.id);
    const releaseDate = model.created ? new Date(model.created * 1000) : null;

    await prisma.$transaction(async (tx) => {
      const upserted = await tx.model.upsert({
        where: { sourceId: model.id },
        update: {
          name: model.name,
          description: model.description ?? "",
          modelType: deriveModelType(model),
          isOpenWeights: isOpenWeights(model),
          hasFreeVariant: hasFreeVar,
          contextWindow: model.context_length ?? null,
          maxOutputTokens:
            model.top_provider?.max_completion_tokens ?? null,
          releaseDate,
          huggingFaceId: model.hugging_face_id ?? null,
          capabilities: deriveCapabilities(model, hasCacheRead),
          minInputPrice,
          minOutputPrice,
          blendedPrice: minBlendedPrice,
          minCacheReadPrice,
          cheapestProviderSlug,
          cheapestProviderName,
          providerCount,
          isDeprecated: providerCount === 0,
        },
        create: {
          sourceId: model.id,
          slug,
          labId: lab.id,
          name: model.name,
          description: model.description ?? "",
          modelType: deriveModelType(model),
          isOpenWeights: isOpenWeights(model),
          hasFreeVariant: hasFreeVar,
          contextWindow: model.context_length ?? null,
          maxOutputTokens:
            model.top_provider?.max_completion_tokens ?? null,
          releaseDate,
          huggingFaceId: model.hugging_face_id ?? null,
          capabilities: deriveCapabilities(model, hasCacheRead),
          minInputPrice,
          minOutputPrice,
          blendedPrice: minBlendedPrice,
          minCacheReadPrice,
          cheapestProviderSlug,
          cheapestProviderName,
          providerCount,
          isDeprecated: providerCount === 0,
        },
      });

      // Replace ModelProvider rows atomically
      await tx.modelProvider.deleteMany({ where: { modelId: upserted.id } });
      if (mpRows.length > 0) {
        await tx.modelProvider.createMany({
          data: mpRows.map((r) => ({ modelId: upserted.id, ...r })),
        });
      }
    });

    existingSourceIds.delete(model.id);
    modelsUpserted++;
    if (modelsUpserted % 25 === 0) {
      process.stdout.write(
        `  ... ${modelsUpserted}/${toProcess.length} models upserted\r`
      );
    }
  }
  console.log(
    `✅ ${modelsUpserted} models upserted                                        `
  );

  // ── 11. Mark deprecated ───────────────────────────────────────────────────
  const toDeprecate = [...existingSourceIds];
  if (toDeprecate.length > 0) {
    await prisma.model.updateMany({
      where: { sourceId: { in: toDeprecate } },
      data: { isDeprecated: true },
    });
    console.log(`🗂️  Marked ${toDeprecate.length} models as deprecated`);
  }
}
