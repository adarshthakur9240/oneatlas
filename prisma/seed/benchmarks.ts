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

  // ── 4. Compute composite scores ───────────────────────────────────────────
  console.log("  🧮 Computing composite scores...");
  const modelsWithScores = await prisma.model.findMany({
    where: {
      isDeprecated: false,
      benchmarkScores: { some: {} },
    },
    include: {
      benchmarkScores: {
        include: { benchmark: { select: { slug: true } } },
      },
    },
  });

  let updated = 0;
  for (const m of modelsWithScores) {
    const scores = m.benchmarkScores;

    // compositeScore: mean over available scores ONLY if >= 2 exist
    let compositeScore: number | null = null;
    if (scores.length >= 2) {
      const normalizedScores = scores.map((s) =>
        normalizeBenchmark(s.benchmark.slug, s.score)
      );
      compositeScore =
        Math.round((normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length) * 10) / 10;
    }

    // codingScore: mean(swe-bench-verified, livecodebench normalized) if >= 1 present
    const codingBmSlugs = new Set(["swe-bench-verified", "livecodebench"]);
    const codingScores = scores
      .filter((s) => codingBmSlugs.has(s.benchmark.slug))
      .map((s) => normalizeBenchmark(s.benchmark.slug, s.score));
    const codingScore =
      codingScores.length >= 1
        ? Math.round((codingScores.reduce((a, b) => a + b, 0) / codingScores.length) * 10) / 10
        : null;

    // intelligenceScore: mean(mmlu-pro, gpqa-diamond normalized) if >= 1 present
    const intelBmSlugs = new Set(["mmlu-pro", "gpqa-diamond"]);
    const intelScores = scores
      .filter((s) => intelBmSlugs.has(s.benchmark.slug))
      .map((s) => normalizeBenchmark(s.benchmark.slug, s.score));
    const intelligenceScore =
      intelScores.length >= 1
        ? Math.round((intelScores.reduce((a, b) => a + b, 0) / intelScores.length) * 10) / 10
        : null;

    await prisma.model.update({
      where: { id: m.id },
      data: {
        compositeScore,
        codingScore,
        intelligenceScore,
      },
    });
    if (compositeScore !== null) updated++;
  }

  console.log(`  ✅ Updated composite scores for ${updated} models`);
}
