// scripts/api-smoke.ts
// Comprehensive end-to-end API smoke test suite
// Asserts envelopes, status codes, validations, filters, sorting, and pagination

export {};

interface TestResult {
  name: string;
  endpoint: string;
  durationMs: number;
  passed: boolean;
  error?: string;
}

interface JsonSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface JsonError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type JsonResponse<T = unknown> = JsonSuccess<T> | JsonError;

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const results: TestResult[] = [];

async function test<T = unknown>(
  name: string,
  endpoint: string,
  fn: (res: Response, json: JsonResponse<T>) => Promise<void> | void,
  init?: RequestInit
) {
  const url = `${BASE_URL}${endpoint}`;
  const start = performance.now();
  try {
    const res = await fetch(url, init);
    const durationMs = Math.round(performance.now() - start);
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      // not json
    }
    await fn(res, json as JsonResponse<T>);
    results.push({ name, endpoint, durationMs, passed: true });
    console.log(`  ✓ [${durationMs}ms] ${name}`);
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    results.push({
      name,
      endpoint,
      durationMs,
      passed: false,
      error: message,
    });
    console.error(`  ✗ [${durationMs}ms] ${name}: ${message}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

interface ModelSummaryRow {
  id: string;
  slug: string;
  name: string;
  lab: { slug: string; name: string };
  isDeprecated: boolean;
  hasFreeVariant: boolean;
  providerCount: number;
  capabilities: string[];
  contextWindow: number | null;
  minInputPrice: number | null;
  minOutputPrice: number | null;
  blendedPrice: number | null;
}

interface ModelDetailRow extends ModelSummaryRow {
  providers: Array<{
    id: string;
    provider: { slug: string; name: string };
    tags: {
      cheapest: boolean;
      fastest: boolean;
      mostReliable: boolean;
    };
  }>;
  benchmarks: Array<{
    benchmark: { slug: string; name: string };
    score: number;
    categoryAverage: number;
    rank: number;
    sourceUrl: string;
  }>;
  related: ModelSummaryRow[];
}

interface CompareResultData {
  models: ModelDetailRow[];
  winners: {
    cheapestInput: string[];
    cheapestOutput: string[];
    cheapestBlended: string[];
    largestContext: string[];
    largestMaxOutput: string[];
    fastestThroughput: string[];
    highestUptime: string[];
    benchmarks: Record<string, string[]>;
  };
}

interface ComparePresetRow {
  id: string;
  name: string;
  description: string;
  models: ModelSummaryRow[];
}

interface RankingItem {
  rank: number;
  model: ModelSummaryRow;
  score: number;
  valueIndex: number | null;
}

interface BenchmarkItem {
  id: string;
  slug: string;
  name: string;
  coverage: number;
  topModels: Array<{ rank: number; score: number; model: ModelSummaryRow }>;
}

interface LabItem {
  id: string;
  slug: string;
  name: string;
  modelCount: number;
  openWeightsCount: number;
  flagship: ModelSummaryRow | null;
}

interface LabDetailData extends LabItem {
  models: ModelSummaryRow[];
  releaseTimeline: Array<{ month: string; count: number }>;
}

interface ProviderItem {
  id: string;
  slug: string;
  name: string;
  hostedModelCount: number;
  startingPrice: number | null;
  cheapestCount: number;
}

interface ProviderDetailData extends ProviderItem {
  hostedModels: Array<{
    model: ModelSummaryRow;
    endpointTag: string;
    inputPrice: number;
    outputPrice: number;
  }>;
}

interface SearchResultData {
  models: Array<{ id: string; slug: string; name: string }>;
  labs: Array<{ id: string; slug: string; name: string }>;
  providers: Array<{ id: string; slug: string; name: string }>;
}

interface FilterFacetsData {
  labs: Array<{ slug: string; name: string; count: number }>;
  providers: Array<{ slug: string; name: string; count: number }>;
  types: Array<{ type: string; count: number }>;
  capabilities: Array<{ capability: string; count: number }>;
  inputModalities: Array<{ modality: string; count: number }>;
  openWeightsCount: number;
  freeCount: number;
  contextBuckets: {
    gte128k: number;
    gte200k: number;
    gte1m: number;
  };
  priceRange: {
    min: number;
    max: number;
  };
  totalListableModels: number;
}

interface StatsData {
  totals: {
    models: number;
    labs: number;
    providers: number;
    apiListings: number;
  };
  releasesPerMonth: Array<{ month: string; count: number }>;
  releasesLast12Months: number;
  capabilityCoverage: {
    toolCalling: number;
    reasoning: number;
    visionInput: number;
    openWeights: number;
  };
  updatedAt: string;
}

async function runSuite() {
  console.log(`\n========================================`);
  console.log(`🚀 Starting OneAtlas API Smoke Test Suite`);
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log(`========================================\n`);

  let sampleModelSlug = "";
  let secondModelSlug = "";
  let sampleLabSlug = "";
  let sampleProviderSlug = "";

  // 1. Health endpoint
  await test<{ status: string; db: string; latencyMs: number; time: string }>(
    "Health check status 200 and db up",
    "/api/health",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(json.data.status === "ok", "Expected status ok");
        assert(json.data.db === "up", "Expected db up");
        assert(typeof json.data.latencyMs === "number", "Expected numeric latencyMs");
      }
    }
  );

  await test("Health Cache-Control is no-store", "/api/health", (res) => {
    const cc = res.headers.get("Cache-Control") || "";
    assert(cc.includes("no-store"), `Expected Cache-Control: no-store, got ${cc}`);
  });

  await test("Response carries x-request-id header", "/api/health", (res) => {
    const rid = res.headers.get("x-request-id");
    assert(Boolean(rid && rid.length > 8), "Expected non-empty x-request-id");
  });

  // 2. Models endpoint - defaults & envelope
  await test<ModelSummaryRow[]>(
    "GET /api/models returns 200 with envelope & meta",
    "/api/models",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(Array.isArray(json.data), "Expected data to be an array");
        assert(json.data.length > 0, "Expected at least 1 model");
        assert(Boolean(json.meta), "Expected meta object");
        const meta = json.meta as { page: number; limit: number; total: number; totalPages: number };
        assert(meta.page === 1, "Expected page 1");
        assert(meta.limit === 18, "Expected default limit 18");
        assert(meta.total > 0, "Expected positive total");
        assert(meta.totalPages > 0, "Expected positive totalPages");

        sampleModelSlug = json.data[0].slug;
        secondModelSlug = json.data[1]?.slug || "";
        sampleLabSlug = json.data[0].lab.slug;
      }
    }
  );

  await test("GET /api/models public Cache-Control", "/api/models", (res) => {
    const cc = (res.headers.get("Cache-Control") || "").toLowerCase();
    const isVercel = Boolean(
      res.headers.get("x-vercel-id") || res.headers.get("x-vercel-cache")
    );

    if (isVercel) {
      const vercelCache = res.headers.get("x-vercel-cache") || "UNKNOWN";
      console.log(`    ℹ️ Detected Vercel Edge CDN (x-vercel-cache: ${vercelCache})`);
      assert(
        cc.includes("public"),
        `Expected public Cache-Control behind Vercel Edge CDN, got ${cc}`
      );
    } else {
      assert(
        cc.includes("s-maxage=60"),
        `Expected s-maxage=60 on direct/local origin response, got ${cc}`
      );
    }
  });

  await test<ModelSummaryRow[]>(
    "Default hideDeprecated hides unserved/deprecated models",
    "/api/models",
    (_, json) => {
      if (json.success) {
        for (const m of json.data) {
          assert(m.isDeprecated === false, `Model ${m.slug} is deprecated`);
          assert(m.providerCount >= 1, `Model ${m.slug} has providerCount < 1`);
        }
      }
    }
  );

  // 3. Validation errors (400)
  await test("400 VALIDATION_ERROR on negative page", "/api/models?page=-1", (res, json) => {
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(json.success === false, "Expected success: false");
    if (!json.success) {
      assert(json.error.code === "VALIDATION_ERROR", `Expected VALIDATION_ERROR, got ${json.error.code}`);
    }
  });

  await test("400 VALIDATION_ERROR on limit > 100", "/api/models?limit=500", (res, json) => {
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(json.success === false, "Expected success: false");
    if (!json.success) {
      assert(json.error.code === "VALIDATION_ERROR", `Expected VALIDATION_ERROR, got ${json.error.code}`);
    }
  });

  await test("400 VALIDATION_ERROR on invalid sort key", "/api/models?sort=unsupported_sort", (res, json) => {
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(json.success === false, "Expected success: false");
    if (!json.success) {
      assert(json.error.code === "VALIDATION_ERROR", `Expected VALIDATION_ERROR, got ${json.error.code}`);
    }
  });

  // 4. Sorting & Filtering
  await test<ModelSummaryRow[]>(
    "Sort price_asc sorts non-null blendedPrice ascending",
    "/api/models?sort=price_asc&limit=15",
    (_, json) => {
      if (json.success) {
        const prices = json.data
          .map((m) => m.blendedPrice)
          .filter((p): p is number => p !== null);
        assert(prices.length >= 2, "Expected multiple priced models");
        for (let i = 0; i < prices.length - 1; i++) {
          assert(prices[i] <= prices[i + 1], `Prices out of order: ${prices[i]} > ${prices[i + 1]}`);
        }
      }
    }
  );

  await test<ModelSummaryRow[]>(
    "Filter by lab returns only that lab",
    `/api/models?lab=${sampleLabSlug}`,
    (_, json) => {
      if (json.success) {
        assert(json.data.length > 0, "Expected models for lab");
        for (const m of json.data) {
          assert(m.lab.slug === sampleLabSlug, `Expected lab ${sampleLabSlug}, got ${m.lab.slug}`);
        }
      }
    }
  );

  await test<ModelSummaryRow[]>(
    "Filter by capability=vision returns only vision models",
    "/api/models?capability=vision",
    (_, json) => {
      if (json.success) {
        assert(json.data.length > 0, "Expected vision models");
        for (const m of json.data) {
          assert(m.capabilities.includes("vision"), `Model ${m.slug} missing vision capability`);
        }
      }
    }
  );

  await test<ModelSummaryRow[]>(
    "Filter by free=true returns only free models or variants",
    "/api/models?free=true",
    (_, json) => {
      if (json.success) {
        assert(json.data.length > 0, "Expected free models");
        for (const m of json.data) {
          const isFree = (m.minInputPrice === 0 && m.minOutputPrice === 0) || m.hasFreeVariant;
          assert(isFree, `Model ${m.slug} is not free: input=${m.minInputPrice}, freeVar=${m.hasFreeVariant}`);
        }
      }
    }
  );

  await test<ModelSummaryRow[]>(
    "Filter by minContext=128000 returns only models >= 128k context",
    "/api/models?minContext=128000",
    (_, json) => {
      if (json.success) {
        assert(json.data.length > 0, "Expected models with >=128k context");
        for (const m of json.data) {
          assert(m.contextWindow !== null && m.contextWindow >= 128000, `Model ${m.slug} context ${m.contextWindow} < 128000`);
        }
      }
    }
  );

  await test<ModelSummaryRow[]>(
    "Filter by maxPrice=1.0 returns only models <= $1.0 blended price",
    "/api/models?maxPrice=1.0",
    (_, json) => {
      if (json.success) {
        assert(json.data.length > 0, "Expected models <= $1.0");
        for (const m of json.data) {
          assert(m.blendedPrice !== null && m.blendedPrice <= 1.0, `Model ${m.slug} price ${m.blendedPrice} > 1.0`);
        }
      }
    }
  );

  // 5. Pagination disjointness
  await test<ModelSummaryRow[]>(
    "Pagination disjointness (page 1 vs page 2)",
    "/api/models?page=1&limit=5",
    async (_, json1) => {
      if (json1.success) {
        const res2 = await fetch(`${BASE_URL}/api/models?page=2&limit=5`);
        const json2 = (await res2.json()) as JsonResponse<ModelSummaryRow[]>;
        if (json2.success) {
          const ids1 = new Set(json1.data.map((m) => m.id));
          const ids2 = new Set(json2.data.map((m) => m.id));
          for (const id of ids2) {
            assert(!ids1.has(id), `Duplicate ID across pages: ${id}`);
          }
        }
      }
    }
  );

  // 6. Model Detail & 404
  await test("404 NOT_FOUND on unknown model slug", "/api/models/non-existent-slug-xyz", (res, json) => {
    assert(res.status === 404, `Expected 404, got ${res.status}`);
    assert(json.success === false, "Expected success: false");
    if (!json.success) {
      assert(json.error.code === "NOT_FOUND", `Expected NOT_FOUND, got ${json.error.code}`);
    }
  });

  await test<ModelDetailRow>(
    "GET /api/models/[slug] returns full detail with provider tags & benchmarks",
    `/api/models/${sampleModelSlug}`,
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        const m = json.data;
        assert(m.slug === sampleModelSlug, "Expected matching slug");
        assert(Array.isArray(m.providers), "Expected providers array");
        assert(m.providers.length > 0, "Expected at least 1 provider");

        const p = m.providers[0];
        assert(typeof p.tags?.cheapest === "boolean", "Expected boolean cheapest tag");
        assert(typeof p.tags?.fastest === "boolean", "Expected boolean fastest tag");
        assert(typeof p.tags?.mostReliable === "boolean", "Expected boolean mostReliable tag");

        assert(Array.isArray(m.benchmarks), "Expected benchmarks array");
        if (m.benchmarks.length > 0) {
          const b = m.benchmarks[0];
          assert(typeof b.categoryAverage === "number", "Expected numeric categoryAverage");
          assert(typeof b.rank === "number" && b.rank >= 1, "Expected rank >= 1");
          assert(typeof b.sourceUrl === "string" && b.sourceUrl.length > 0, "Expected sourceUrl citation");
        }

        assert(Array.isArray(m.related), "Expected related models array");
        assert(m.related.length <= 6, "Expected at most 6 related models");
      }
    }
  );

  // 7. Compare endpoint & validations
  await test("400 on compare with missing slugs", "/api/compare", (res, json) => {
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    if (!json.success) {
      assert(json.error.code === "VALIDATION_ERROR", `Expected VALIDATION_ERROR, got ${json.error.code}`);
    }
  });

  await test("400 on compare with single slug", "/api/compare?slugs=only-one", (res, json) => {
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    if (!json.success) {
      assert(json.error.code === "VALIDATION_ERROR", `Expected VALIDATION_ERROR, got ${json.error.code}`);
    }
  });

  await test("400 on compare with 5 slugs (> 4)", "/api/compare?slugs=s1,s2,s3,s4,s5", (res, json) => {
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    if (!json.success) {
      assert(json.error.code === "VALIDATION_ERROR", `Expected VALIDATION_ERROR, got ${json.error.code}`);
    }
  });

  await test<CompareResultData>(
    "GET /api/compare with 2 valid models returns pairwise winner flags",
    `/api/compare?slugs=${sampleModelSlug},${secondModelSlug}`,
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(json.data.models.length === 2, `Expected 2 models, got ${json.data.models.length}`);
        assert(Boolean(json.data.winners), "Expected winners object");
        assert(Array.isArray(json.data.winners.cheapestBlended), "Expected cheapestBlended winners array");
        assert(Array.isArray(json.data.winners.largestContext), "Expected largestContext winners array");
      }
    }
  );

  // 8. Compare Presets
  await test<ComparePresetRow[]>(
    "GET /api/compare/presets returns 4 populated presets",
    "/api/compare/presets",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(Array.isArray(json.data), "Expected array of presets");
        assert(json.data.length === 4, `Expected 4 presets, got ${json.data.length}`);
        for (const p of json.data) {
          assert(p.models.length >= 2, `Preset ${p.name} has fewer than 2 models`);
        }
      }
    }
  );

  // 9. Rankings endpoint
  await test<RankingItem[]>(
    "GET /api/rankings?benchmark=composite returns ranked models with valueIndex",
    "/api/rankings?benchmark=composite&limit=10",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(json.data.length > 0, "Expected ranked rows");
        for (let i = 0; i < json.data.length; i++) {
          assert(json.data[i].rank === i + 1, `Rank mismatch at index ${i}`);
          assert(typeof json.data[i].score === "number", "Expected numeric score");
        }
      }
    }
  );

  await test<RankingItem[]>(
    "GET /api/rankings?benchmark=swe-bench-verified sorted descending",
    "/api/rankings?benchmark=swe-bench-verified",
    (_, json) => {
      if (json.success) {
        assert(json.data.length > 0, "Expected swe-bench rows");
        for (let i = 0; i < json.data.length - 1; i++) {
          assert(json.data[i].score >= json.data[i + 1].score, `Rankings not sorted descending`);
        }
      }
    }
  );

  // 10. Benchmarks endpoint
  await test<BenchmarkItem[]>(
    "GET /api/benchmarks returns 5 benchmarks with coverage & topModels",
    "/api/benchmarks",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(json.data.length === 5, `Expected 5 benchmarks, got ${json.data.length}`);
        for (const b of json.data) {
          assert(typeof b.coverage === "number" && b.coverage >= 0, "Expected coverage count");
          assert(Array.isArray(b.topModels), "Expected topModels array");
          assert(b.topModels.length <= 5, "Expected at most 5 top models");
        }
      }
    }
  );

  // 11. Labs & Lab Detail
  await test<LabItem[]>(
    "GET /api/labs returns labs with modelCount & flagship",
    "/api/labs",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(json.data.length > 0, "Expected labs array");
        const firstLab = json.data.find((l) => l.modelCount > 0);
        assert(Boolean(firstLab), "Expected at least 1 lab with models");
        if (firstLab) {
          sampleLabSlug = firstLab.slug;
        }
      }
    }
  );

  await test("404 NOT_FOUND on unknown lab", "/api/labs/non-existent-lab-xyz", (res, json) => {
    assert(res.status === 404, `Expected 404, got ${res.status}`);
    if (!json.success) {
      assert(json.error.code === "NOT_FOUND", `Expected NOT_FOUND, got ${json.error.code}`);
    }
  });

  await test<LabDetailData>(
    "GET /api/labs/[slug] returns lab with release timeline",
    `/api/labs/${sampleLabSlug}`,
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(json.data.slug === sampleLabSlug, "Expected matching lab slug");
        assert(Array.isArray(json.data.models), "Expected models array");
        assert(Array.isArray(json.data.releaseTimeline), "Expected releaseTimeline array");
      }
    }
  );

  // 12. Providers & Provider Detail
  await test<ProviderItem[]>(
    "GET /api/providers returns providers with startingPrice & cheapestCount",
    "/api/providers",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(json.data.length > 0, "Expected providers array");
        const activeProvider = json.data.find((p) => p.hostedModelCount > 0);
        assert(Boolean(activeProvider), "Expected at least 1 provider with hosted models");
        if (activeProvider) {
          sampleProviderSlug = activeProvider.slug;
        }
      }
    }
  );

  await test("404 NOT_FOUND on unknown provider", "/api/providers/non-existent-provider-xyz", (res, json) => {
    assert(res.status === 404, `Expected 404, got ${res.status}`);
    if (!json.success) {
      assert(json.error.code === "NOT_FOUND", `Expected NOT_FOUND, got ${json.error.code}`);
    }
  });

  await test<ProviderDetailData>(
    "GET /api/providers/[slug] returns hosted models and endpoint details",
    `/api/providers/${sampleProviderSlug}`,
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(json.data.slug === sampleProviderSlug, "Expected matching provider slug");
        assert(Array.isArray(json.data.hostedModels), "Expected hostedModels array");
        assert(json.data.hostedModels.length > 0, "Expected at least 1 hosted model");
      }
    }
  );

  // 13. Search endpoint
  await test<SearchResultData>(
    "GET /api/search with empty query returns 200 with empty arrays",
    "/api/search?q=",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        assert(Array.isArray(json.data.models) && json.data.models.length === 0, "Expected empty models");
        assert(Array.isArray(json.data.labs) && json.data.labs.length === 0, "Expected empty labs");
        assert(Array.isArray(json.data.providers) && json.data.providers.length === 0, "Expected empty providers");
      }
    }
  );

  await test<SearchResultData>(
    "GET /api/search?q=claude returns matching models and Anthropic lab",
    "/api/search?q=claude",
    (_, json) => {
      if (json.success) {
        assert(json.data.models.length > 0, "Expected models matching claude");
        const hasClaude = json.data.models.some((m) => m.name.toLowerCase().includes("claude"));
        assert(hasClaude, "Expected model containing claude");
      }
    }
  );

  // 14. Filters endpoint
  await test<FilterFacetsData>(
    "GET /api/filters returns facets, contextBuckets, priceRange",
    "/api/filters",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        const f = json.data;
        assert(Array.isArray(f.labs) && f.labs.length > 0, "Expected labs facet");
        assert(Array.isArray(f.providers) && f.providers.length > 0, "Expected providers facet");
        assert(Array.isArray(f.types) && f.types.length > 0, "Expected types facet");
        assert(Array.isArray(f.capabilities) && f.capabilities.length > 0, "Expected capabilities facet");
        assert(Array.isArray(f.inputModalities) && f.inputModalities.length > 0, "Expected inputModalities facet");
        assert(typeof f.openWeightsCount === "number", "Expected numeric openWeightsCount");
        assert(typeof f.freeCount === "number", "Expected numeric freeCount");
        assert(typeof f.contextBuckets?.gte128k === "number", "Expected gte128k bucket");
        assert(typeof f.priceRange?.min === "number", "Expected min price");
        assert(typeof f.priceRange?.max === "number", "Expected max price");
        assert(f.totalListableModels > 0, "Expected positive totalListableModels");
      }
    }
  );

  // 15. Stats endpoint
  await test<StatsData>(
    "GET /api/stats returns platform totals and 12-month release trend",
    "/api/stats",
    (res, json) => {
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(json.success === true, "Expected success: true");
      if (json.success) {
        const s = json.data;
        assert(s.totals.models > 0, "Expected models count");
        assert(s.totals.labs > 0, "Expected labs count");
        assert(s.totals.providers > 0, "Expected providers count");
        assert(s.totals.apiListings > 0, "Expected apiListings count");
        assert(Array.isArray(s.releasesPerMonth) && s.releasesPerMonth.length === 12, "Expected 12 calendar months");
        assert(typeof s.releasesLast12Months === "number", "Expected releasesLast12Months");
        assert(typeof s.capabilityCoverage?.toolCalling === "number", "Expected toolCalling coverage");
        assert(typeof s.capabilityCoverage?.reasoning === "number", "Expected reasoning coverage");
        assert(typeof s.capabilityCoverage?.visionInput === "number", "Expected visionInput coverage");
        assert(typeof s.capabilityCoverage?.openWeights === "number", "Expected openWeights coverage");
        assert(Boolean(s.updatedAt), "Expected updatedAt timestamp");
      }
    }
  );

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\n========================================`);
  console.log(`📊 Smoke Test Summary: ${passed}/${total} passed (${failed} failed)`);
  console.log(`========================================\n`);

  if (failed > 0) {
    console.error(`❌ Suite failed with ${failed} error(s).`);
    process.exit(1);
  } else {
    console.log(`🎉 All ${total} API smoke assertions passed successfully!\n`);
  }
}

runSuite().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
