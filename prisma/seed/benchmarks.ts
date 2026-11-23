// prisma/seed/benchmarks.ts
// Ingest curated benchmark data into the database
// All scores come from primary sources — no fabrication.

import path from "path";
import { readFileSync } from "fs";
import { prisma } from "../../src/lib/prisma";
import { normalizeBenchmark } from "../../src/lib/pricing";

// Benchmark definitions
const BENCHMARKS = [
  {
    slug: "mmlu-pro",
    name: "MMLU-Pro",
    category: "General",
    unit: "%",
    description:
      "Massive Multitask Language Understanding (Pro variant with harder, reasoning-required questions). Higher = better.",
  },
  {
    slug: "gpqa-diamond",
    name: "GPQA Diamond",
    category: "Science",
    unit: "%",
    description:
      "Graduate-level Google-Proof Q&A — Diamond subset. Expert-difficulty science questions. Higher = better.",
  },
  {
    slug: "swe-bench-verified",
    name: "SWE-bench Verified",
    category: "Coding",
    unit: "%",
    description:
      "Real GitHub issues resolved autonomously. Human-verified subset. Higher = better.",
  },
  {
    slug: "livecodebench",
    name: "LiveCodeBench",
    category: "Coding",
    unit: "%",
    description:
      "Live competitive programming problems. Contamination-resistant. Higher = better.",
  },
  {
    slug: "arena-elo",
    name: "Chatbot Arena Elo",
    category: "Human Preference",
    unit: "Elo",
    description:
      "Human-preference Elo from LMSYS Chatbot Arena blind A/B comparisons. Higher = better.",
  },
] as const;

type BenchmarkEntry = {
  sourceId: string;
  benchmarks: Record<
    string,
    {
      score: number;
      sourceUrl: string;
      evaluatedAt: string;
      isVendorReported: boolean;
    }
  >;
};

export async function ingestBenchmarks(): Promise<void> {
  console.log("📊 Ingesting curated benchmark data...");

  // ── 1. Upsert benchmark definitions ──────────────────────────────────────
  for (const bm of BENCHMARKS) {
    await prisma.benchmark.upsert({
      where: { slug: bm.slug },
      update: { name: bm.name, category: bm.category, unit: bm.unit, description: bm.description },
      create: { slug: bm.slug, name: bm.name, category: bm.category, unit: bm.unit, description: bm.description },
    });
  }
  console.log(`  ✅ Upserted ${BENCHMARKS.length} benchmark definitions`);

  // ── 2. Load curated data ──────────────────────────────────────────────────
  const dataPath = path.join(
    process.cwd(),
    "prisma",
    "seed",
    "data",
    "benchmarks.curated.json"
  );
  const rawData = readFileSync(dataPath, "utf-8");
  const entries = JSON.parse(rawData) as BenchmarkEntry[];

  // ── 3. Upsert scores ──────────────────────────────────────────────────────
  let scored = 0;
  let missing = 0;

  for (const entry of entries) {
    const model = await prisma.model.findUnique({
      where: { sourceId: entry.sourceId },
      select: { id: true },
    });

    if (!model) {
      console.warn(`  ⚠️  Model not found in DB: ${entry.sourceId} — skipping`);
      missing++;
      continue;
    }

    for (const [bmSlug, bmData] of Object.entries(entry.benchmarks)) {
      const benchmark = await prisma.benchmark.findUnique({
        where: { slug: bmSlug },
      });
      if (!benchmark) {
        console.warn(`  ⚠️  Unknown benchmark slug: ${bmSlug}`);
        continue;
      }

      await prisma.benchmarkScore.upsert({
        where: { modelId_benchmarkId: { modelId: model.id, benchmarkId: benchmark.id } },
        update: {
          score: bmData.score,
          isVendorReported: bmData.isVendorReported,
          sourceUrl: bmData.sourceUrl,
          evaluatedAt: bmData.evaluatedAt ? new Date(bmData.evaluatedAt) : null,
        },
        create: {
          modelId: model.id,
          benchmarkId: benchmark.id,
          score: bmData.score,
          isVendorReported: bmData.isVendorReported,
          sourceUrl: bmData.sourceUrl,
          evaluatedAt: bmData.evaluatedAt ? new Date(bmData.evaluatedAt) : null,
        },
      });
      scored++;
    }
  }

  console.log(
    `  ✅ Upserted ${scored} benchmark scores (${missing} models not found in DB)`
  );

  // ── 4. Compute composite scores from ALL scores in DB ─────────────────────
  await recomputeDerivedScores();
}

/**
 * Recompute compositeScore, codingScore, and intelligenceScore for all models
 * with benchmark scores. Re-exported so that both curated and AA ingestion steps
 * evaluate all existing BenchmarkScore rows additively.
 */
export interface RecomputeResult {
  updated: number;
  changes: Array<{
    slug: string;
    name: string;
    old: {
      scoreBasis: string | null;
      compositeScore: number | null;
      intelligenceScore: number | null;
      codingScore: number | null;
    };
    new: {
      scoreBasis: "aa" | "vendor" | null;
      compositeScore: number | null;
      intelligenceScore: number | null;
      codingScore: number | null;
    };
    changed: boolean;
  }>;
}

/**
 * Recompute compositeScore, codingScore, intelligenceScore, and scoreBasis
 * for all models with benchmark scores.
 * - If model has AA intelligence index:
 *     scoreBasis = "aa", compositeScore = intelligenceScore = that AA index,
 *     codingScore = AA coding index if present, else null (vendor scores ignored).
 * - Otherwise, if it has vendor-reported scores:
 *     scoreBasis = "vendor", compositeScore = mean(vendor normalized >= 2),
 *     intelligenceScore = mean(mmlu-pro, gpqa-diamond), codingScore = mean(swe-bench, livecodebench).
 * - Otherwise:
 *     scoreBasis = null, compositeScore = null, intelligenceScore = null, codingScore = null.
 */
export async function recomputeDerivedScores(options?: {
  dryRun?: boolean;
}): Promise<RecomputeResult> {
  const dryRun = options?.dryRun ?? false;
  console.log(`  🧮 Computing derived scores (dryRun=${dryRun})...`);

  const modelsWithScores = await prisma.model.findMany({
    where: {
      benchmarkScores: { some: {} },
    },
    include: {
      benchmarkScores: {
        include: { benchmark: { select: { slug: true } } },
      },
    },
    orderBy: { slug: "asc" },
  });

  const changes: RecomputeResult["changes"] = [];
  let updated = 0;

  for (const m of modelsWithScores) {
    const scores = m.benchmarkScores;
    const aaIntelScore = scores.find((s) => s.benchmark.slug === "intelligence-index");
    const aaCodingScore = scores.find((s) => s.benchmark.slug === "coding-index");

    let newScoreBasis: "aa" | "vendor" | null = null;
    let newCompositeScore: number | null = null;
    let newIntelligenceScore: number | null = null;
    let newCodingScore: number | null = null;

    if (aaIntelScore) {
      newScoreBasis = "aa";
      newCompositeScore = aaIntelScore.score;
      newIntelligenceScore = aaIntelScore.score;
      newCodingScore = aaCodingScore ? aaCodingScore.score : null;
    } else {
      const vendorBmSlugs = new Set([
        "mmlu-pro",
        "gpqa-diamond",
        "swe-bench-verified",
        "livecodebench",
        "arena-elo",
      ]);
      const vendorScores = scores.filter(
        (s) => s.isVendorReported || vendorBmSlugs.has(s.benchmark.slug)
      );

      if (vendorScores.length > 0) {
        newScoreBasis = "vendor";

        // compositeScore: mean over available vendor scores ONLY if >= 2 exist
        if (vendorScores.length >= 2) {
          const normalized = vendorScores.map((s) =>
            normalizeBenchmark(s.benchmark.slug, s.score)
          );
          newCompositeScore =
            Math.round(
              (normalized.reduce((a, b) => a + b, 0) / normalized.length) * 10
            ) / 10;
        }

        // codingScore: mean(swe-bench-verified, livecodebench) if >= 1
        const codingSlugs = new Set(["swe-bench-verified", "livecodebench"]);
        const coding = vendorScores
          .filter((s) => codingSlugs.has(s.benchmark.slug))
          .map((s) => normalizeBenchmark(s.benchmark.slug, s.score));
        newCodingScore =
          coding.length >= 1
            ? Math.round((coding.reduce((a, b) => a + b, 0) / coding.length) * 10) / 10
            : null;

        // intelligenceScore: mean(mmlu-pro, gpqa-diamond) if >= 1
        const intelSlugs = new Set(["mmlu-pro", "gpqa-diamond"]);
        const intel = vendorScores
          .filter((s) => intelSlugs.has(s.benchmark.slug))
          .map((s) => normalizeBenchmark(s.benchmark.slug, s.score));
        newIntelligenceScore =
          intel.length >= 1
            ? Math.round((intel.reduce((a, b) => a + b, 0) / intel.length) * 10) / 10
            : null;
      }
    }

    const changed =
      m.scoreBasis !== newScoreBasis ||
      m.compositeScore !== newCompositeScore ||
      m.intelligenceScore !== newIntelligenceScore ||
      m.codingScore !== newCodingScore;

    changes.push({
      slug: m.slug,
      name: m.name,
      old: {
        scoreBasis: m.scoreBasis,
        compositeScore: m.compositeScore,
        intelligenceScore: m.intelligenceScore,
        codingScore: m.codingScore,
      },
      new: {
        scoreBasis: newScoreBasis,
        compositeScore: newCompositeScore,
        intelligenceScore: newIntelligenceScore,
        codingScore: newCodingScore,
      },
      changed,
    });

    if (!dryRun && changed) {
      await prisma.model.update({
        where: { id: m.id },
        data: {
          scoreBasis: newScoreBasis,
          compositeScore: newCompositeScore,
          intelligenceScore: newIntelligenceScore,
          codingScore: newCodingScore,
        },
      });
      updated++;
    }
  }

  if (dryRun) {
    console.log(`  🔍 Dry-run complete: ${changes.filter((c) => c.changed).length} models would be updated.`);
  } else {
    console.log(`  ✅ Updated derived scores for ${updated} models`);
  }

  return { updated, changes };
}

