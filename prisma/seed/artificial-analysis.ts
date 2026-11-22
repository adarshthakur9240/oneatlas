// prisma/seed/artificial-analysis.ts
// Artificial Analysis (AA) benchmark data ingestion module
// Ingests verified independent evaluation indices from Artificial Analysis API.
// Never logs API keys. Idempotent and additive.

import fs from "fs";
import path from "path";
import https from "https";
import { z } from "zod";
import { prisma } from "../../src/lib/prisma";
import { recomputeDerivedScores } from "./benchmarks";

// ── 1. Zod Schemas ──────────────────────────────────────────────────────────

const AaEvaluationsSchema = z
  .object({
    artificial_analysis_intelligence_index: z.number().nullable().optional(),
    artificial_analysis_coding_index: z.number().nullable().optional(),
    artificial_analysis_agentic_index: z.number().nullable().optional(),
    artificial_analysis_engineering_index: z.number().nullable().optional(),
    artificial_analysis_finance_and_accounting_index: z.number().nullable().optional(),
    artificial_analysis_strategy_and_ops_index: z.number().nullable().optional(),
    artificial_analysis_legal_index: z.number().nullable().optional(),
    artificial_analysis_healthcare_and_medical_index: z.number().nullable().optional(),
    artificial_analysis_economics_index: z.number().nullable().optional(),
    // Allow potential future standard benchmarks
    mmlu_pro: z.number().nullable().optional(),
    gpqa_diamond: z.number().nullable().optional(),
    livecodebench: z.number().nullable().optional(),
    swe_bench_verified: z.number().nullable().optional(),
  })
  .passthrough();

const AaModelSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    release_date: z.string().nullable().optional(),
    model_creator: z
      .object({
        id: z.string().optional(),
        name: z.string(),
      })
      .nullable()
      .optional(),
    evaluations: AaEvaluationsSchema.nullable().optional(),
  })
  .passthrough();

const AaApiResponseSchema = z
  .object({
    tier: z.string().optional(),
    intelligence_index_version: z.union([z.string(), z.number()]).optional(),
    pagination: z
      .object({
        page: z.number().optional(),
        page_size: z.number().optional(),
        total_pages: z.number().optional(),
        has_more: z.boolean().optional(),
      })
      .optional(),
    data: z.array(AaModelSchema),
  })
  .passthrough();

export type AaModel = z.infer<typeof AaModelSchema>;

// ── 2. Benchmark Definitions & Mapping ──────────────────────────────────────

export const AA_BENCHMARKS = [
  {
    slug: "intelligence-index",
    name: "Artificial Analysis Intelligence Index",
    category: "General",
    unit: "Index",
    description:
      "Aggregate intelligence index combining multiple reasoning, knowledge, and problem-solving benchmarks (0–100 scale). Higher = better.",
  },
  {
    slug: "coding-index",
    name: "Artificial Analysis Coding Index",
    category: "Coding",
    unit: "Index",
    description:
      "Aggregate coding and software engineering capability index (0–100 scale). Higher = better.",
  },
  {
    slug: "engineering-index",
    name: "Artificial Analysis Engineering Index",
    category: "Engineering",
    unit: "Index",
    description:
      "Technical engineering, problem-solving, and applied reasoning index (0–100 scale). Higher = better.",
  },
  {
    slug: "finance-accounting-index",
    name: "Artificial Analysis Finance & Accounting Index",
    category: "Business",
    unit: "Index",
    description:
      "Financial analysis, accounting, and quantitative reasoning index (0–100 scale). Higher = better.",
  },
  {
    slug: "strategy-ops-index",
    name: "Artificial Analysis Strategy & Ops Index",
    category: "Business",
    unit: "Index",
    description:
      "Strategic operations, executive planning, and business analysis index (0–100 scale). Higher = better.",
  },
  {
    slug: "legal-index",
    name: "Artificial Analysis Legal Index",
    category: "Domain Knowledge",
    unit: "Index",
    description:
      "Legal reasoning, case law, and contract analysis index (0–100 scale). Higher = better.",
  },
  {
    slug: "healthcare-medical-index",
    name: "Artificial Analysis Healthcare & Medical Index",
    category: "Domain Knowledge",
    unit: "Index",
    description:
      "Medical sciences, diagnostic reasoning, and healthcare domain index (0–100 scale). Higher = better.",
  },
  {
    slug: "economics-index",
    name: "Artificial Analysis Economics Index",
    category: "Domain Knowledge",
    unit: "Index",
    description:
      "Micro/macroeconomics, quantitative analysis, and economic policy index (0–100 scale). Higher = better.",
  },
] as const;

// Map evaluation fields in API payload to OneAtlas benchmark slugs
const EVAL_KEY_TO_BENCHMARK_SLUG: Record<string, string> = {
  artificial_analysis_intelligence_index: "intelligence-index",
  artificial_analysis_coding_index: "coding-index",
  artificial_analysis_engineering_index: "engineering-index",
  artificial_analysis_finance_and_accounting_index: "finance-accounting-index",
  artificial_analysis_strategy_and_ops_index: "strategy-ops-index",
  artificial_analysis_legal_index: "legal-index",
  artificial_analysis_healthcare_and_medical_index: "healthcare-medical-index",
  artificial_analysis_economics_index: "economics-index",
  mmlu_pro: "mmlu-pro",
  gpqa_diamond: "gpqa-diamond",
  livecodebench: "livecodebench",
  swe_bench_verified: "swe-bench-verified",
};

// ── 3. Normalization & Matching Utilities ───────────────────────────────────

function normalizeSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[._]/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripEffortSuffix(s: string): string {
  return s
    .toLowerCase()
    .replace(/\((default fallback|non-reasoning|reasoning|medium|low|high|xhigh|max|preview)[^)]*\)/g, "")
    .replace(/-(default-fallback|non-reasoning|reasoning|medium|low|high|xhigh|max|preview)$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── 4. Cache and Fetch Functions ───────────────────────────────────────────

const CACHE_DIR = path.join(process.cwd(), ".cache", "aa");
const CACHE_FILE = path.join(CACHE_DIR, "models.json");

export async function fetchAaModels(options?: { refresh?: boolean }): Promise<AaModel[]> {
  const refresh = options?.refresh ?? false;

  if (!refresh && fs.existsSync(CACHE_FILE)) {
    console.log("  📦 Loading Artificial Analysis models from cache (.cache/aa/models.json)...");
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsedJson = JSON.parse(raw);
    const parsed = AaApiResponseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error(`Invalid cached AA data shape: ${parsed.error.message}`);
    }
    return parsed.data.data;
  }

  // Live fetch
  console.log("  🌐 Fetching models from Artificial Analysis API (v2)...");
  const rawApiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY;
  if (!rawApiKey || !rawApiKey.trim()) {
    throw new Error(
      "Missing ARTIFICIAL_ANALYSIS_API_KEY environment variable. Add it to .env to run with --aa."
    );
  }
  const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "");

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const rawData = await new Promise<string>((resolve, reject) => {
    const req = https.request(
      {
        hostname: "artificialanalysis.ai",
        path: "/api/v2/language/models/free",
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
          "User-Agent": "OneAtlas/1.0",
        },
      },
      (res) => {
        if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
          reject(
            new Error(
              `Artificial Analysis API returned HTTP ${res.statusCode} ${res.statusMessage}. Key rejected or insufficient permissions.`
            )
          );
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Artificial Analysis API returned HTTP ${res.statusCode}`));
          return;
        }

        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve(body));
      }
    );

    req.on("error", (err) => reject(new Error(`Network error contacting AA: ${err.message}`)));
    req.end();
  });

  fs.writeFileSync(CACHE_FILE, rawData, "utf-8");
  console.log("  💾 Cached Artificial Analysis response to .cache/aa/models.json");

  const parsedJson = JSON.parse(rawData);
  const parsed = AaApiResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`Invalid AA API response structure: ${parsed.error.message}`);
  }
  return parsed.data.data;
}

// ── 5. Main Ingest Function ────────────────────────────────────────────────

export interface IngestAaOptions {
  refresh?: boolean;
  dryRun?: boolean;
}

export async function ingestArtificialAnalysis(options?: IngestAaOptions): Promise<{
  matchedCount: number;
  newScoresCount: number;
  totalEvaluated: number;
}> {
  const dryRun = options?.dryRun ?? false;
  const refresh = options?.refresh ?? false;

  console.log(`📊 Ingesting Artificial Analysis benchmarks ${dryRun ? "[DRY RUN]" : ""}...`);

  // 1. Fetch or read from cache
  const aaModels = await fetchAaModels({ refresh });
  const evaluatedModels = aaModels.filter(
    (m) => m.evaluations && Object.values(m.evaluations).some((v) => v !== null && v !== undefined)
  );

  console.log(
    `  Found ${aaModels.length} models in AA dataset (${evaluatedModels.length} with evaluation scores)`
  );

  // 2. Load DB models
  const dbModels = await prisma.model.findMany({
    where: { isDeprecated: false },
    select: {
      id: true,
      slug: true,
      name: true,
      sourceId: true,
      lab: { select: { name: true, slug: true } },
    },
  });

  // 3. Load reviewed manual map
  const manualMapPath = path.join(
    process.cwd(),
    "prisma",
    "seed",
    "data",
    "aa-manual-map.json"
  );
  let manualMap: Record<string, string | null> = {};
  if (fs.existsSync(manualMapPath)) {
    manualMap = JSON.parse(fs.readFileSync(manualMapPath, "utf-8"));
  }

  // 4. Match AA models to OneAtlas DB models
  const matches: Array<{ aa: AaModel; dbId: string; sourceId: string; reason: string }> = [];
  const skippedVariants: Array<{ aa: AaModel; reason: string }> = [];
  const unmatched: Array<{ aa: AaModel; reason: string }> = [];
  const ambiguous: Array<{ aa: AaModel; candidates: string[] }> = [];

  for (const aa of evaluatedModels) {
    // Check reviewed exceptions
    if (manualMap[aa.slug] !== undefined) {
      if (manualMap[aa.slug] === null) {
        skippedVariants.push({ aa, reason: "reviewed-reasoning-variant-skip" });
        continue;
      }
      const db = dbModels.find((d) => d.sourceId === manualMap[aa.slug]);
      if (db) {
        matches.push({ aa, dbId: db.id, sourceId: db.sourceId, reason: "manual-map" });
        continue;
      }
    }

    const aaSlugNorm = normalizeSlug(stripEffortSuffix(aa.slug));
    const aaNameNorm = normalizeSlug(stripEffortSuffix(aa.name));

    // Exclude :batch models from consideration
    const candidates = dbModels.filter((db) => {
      if (db.sourceId.endsWith(":batch")) return false;
      const dbSlugNorm = normalizeSlug(db.slug);
      const dbSourceSuffix = normalizeSlug(db.sourceId.split("/")[1] || db.sourceId);

      return (
        dbSlugNorm === aaSlugNorm ||
        dbSourceSuffix === aaSlugNorm ||
        normalizeSlug(db.name) === aaNameNorm
      );
    });

    if (candidates.length === 1) {
      matches.push({
        aa,
        dbId: candidates[0]!.id,
        sourceId: candidates[0]!.sourceId,
        reason: "deterministic-exact",
      });
    } else if (candidates.length > 1) {
      ambiguous.push({ aa, candidates: candidates.map((c) => c.sourceId) });
    } else {
      unmatched.push({ aa, reason: "not-in-openrouter-catalog" });
    }
  }

  console.log("\n  ── Matching Summary ─────────────────────────────");
  console.log(`  • Total evaluated AA models:  ${evaluatedModels.length}`);
  console.log(`  • Matched to OneAtlas models: ${matches.length}`);
  console.log(`  • Skipped reasoning variants: ${skippedVariants.length}`);
  console.log(`  • Unmatched AA models:        ${unmatched.length}`);
  console.log(`  • Ambiguous matches:          ${ambiguous.length}`);
  const matchRate = (
    (matches.length / (evaluatedModels.length - skippedVariants.length)) *
    100
  ).toFixed(1);
  console.log(`  • Net match rate (ex-variants): ${matchRate}%`);

  if (ambiguous.length > 0) {
    console.warn("\n  ⚠️  Ambiguous matches (skipped per strict rule):");
    for (const a of ambiguous) {
      console.warn(`    - ${a.aa.name} (${a.aa.slug}) -> candidates: ${a.candidates.join(", ")}`);
    }
  }

  if (unmatched.length > 0) {
    console.log("\n  ℹ️  Unmatched AA models (absent from OpenRouter catalog):");
    for (const u of unmatched) {
      console.log(`    - ${u.aa.name} (${u.aa.slug}) [Creator: ${u.aa.model_creator?.name ?? "Unknown"}]`);
    }
  }

  // 5. Build list of BenchmarkScore operations to perform
  type PendingScore = {
    modelId: string;
    sourceId: string;
    benchmarkSlug: string;
    score: number;
    sourceUrl: string;
    evaluatedAt: Date | null;
  };

  const pendingScores: PendingScore[] = [];

  for (const match of matches) {
    const { aa, dbId, sourceId } = match;
    const sourceUrl = `https://artificialanalysis.ai/models/${aa.slug}`;
    const evaluatedAt = aa.release_date ? new Date(aa.release_date) : null;

    if (!aa.evaluations) continue;

    for (const [key, value] of Object.entries(aa.evaluations)) {
      if (typeof value !== "number" || value === null) continue;
      const benchmarkSlug = EVAL_KEY_TO_BENCHMARK_SLUG[key];
      if (!benchmarkSlug) continue;

      pendingScores.push({
        modelId: dbId,
        sourceId,
        benchmarkSlug,
        score: value,
        sourceUrl,
        evaluatedAt,
      });
    }
  }

  console.log(`\n  Generated ${pendingScores.length} benchmark score entries for insertion.`);

  if (dryRun) {
    console.log("\n  🔍 [DRY RUN] No database writes performed.");
    console.log("  Sample scores that would be inserted:");
    for (const s of pendingScores.slice(0, 10)) {
      console.log(
        `    • ${s.sourceId.padEnd(32)} ${s.benchmarkSlug.padEnd(28)} score: ${s.score.toFixed(1).padStart(5)} (url: ${s.sourceUrl})`
      );
    }
    return {
      matchedCount: matches.length,
      newScoresCount: pendingScores.length,
      totalEvaluated: evaluatedModels.length,
    };
  }

  // 6. DB Writes
  // 6a. Upsert benchmark definitions
  for (const bm of AA_BENCHMARKS) {
    await prisma.benchmark.upsert({
      where: { slug: bm.slug },
      update: { name: bm.name, category: bm.category, unit: bm.unit, description: bm.description },
      create: { slug: bm.slug, name: bm.name, category: bm.category, unit: bm.unit, description: bm.description },
    });
  }
  console.log(`  ✅ Upserted ${AA_BENCHMARKS.length} Artificial Analysis benchmark definitions.`);

  // 6b. Insert scores (never overwrite isVendorReported: true)
  let writtenScores = 0;
  let skippedVendorScores = 0;

  for (const ps of pendingScores) {
    const benchmark = await prisma.benchmark.findUnique({
      where: { slug: ps.benchmarkSlug },
      select: { id: true },
    });
    if (!benchmark) continue;

    // Check existing score
    const existing = await prisma.benchmarkScore.findUnique({
      where: {
        modelId_benchmarkId: {
          modelId: ps.modelId,
          benchmarkId: benchmark.id,
        },
      },
      select: { isVendorReported: true },
    });

    if (existing?.isVendorReported) {
      // NEVER overwrite curated vendor-reported scores
      skippedVendorScores++;
      continue;
    }

    await prisma.benchmarkScore.upsert({
      where: {
        modelId_benchmarkId: {
          modelId: ps.modelId,
          benchmarkId: benchmark.id,
        },
      },
      update: {
        score: ps.score,
        isVendorReported: false,
        sourceUrl: ps.sourceUrl,
        evaluatedAt: ps.evaluatedAt,
      },
      create: {
        modelId: ps.modelId,
        benchmarkId: benchmark.id,
        score: ps.score,
        isVendorReported: false,
        sourceUrl: ps.sourceUrl,
        evaluatedAt: ps.evaluatedAt,
      },
    });
    writtenScores++;
  }

  console.log(
    `  ✅ Ingested ${writtenScores} benchmark scores from AA (${skippedVendorScores} preserved existing vendor scores)`
  );

  // 7. Recompute derived composite, intelligence, and coding scores from ALL DB rows
  await recomputeDerivedScores();

  return {
    matchedCount: matches.length,
    newScoresCount: writtenScores,
    totalEvaluated: evaluatedModels.length,
  };
}

// Standalone execution support
if (require.main === module) {
  const refresh = process.argv.includes("--refresh") || process.argv.includes("--refresh-aa");
  const dryRun = process.argv.includes("--dry-run");

  ingestArtificialAnalysis({ refresh, dryRun })
    .catch((err) => {
      console.error("❌ AA Ingest failed:", err.message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
