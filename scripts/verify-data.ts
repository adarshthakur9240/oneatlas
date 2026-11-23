// scripts/verify-data.ts
// Comprehensive data verification script for OneAtlas
// Exits with non-zero status on any integrity assertion failure.

import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  console.log("==================================================");
  console.log("       OneAtlas Data Integrity Verification       ");
  console.log("==================================================\n");

  let failed = false;
  function assert(condition: boolean, message: string): void {
    if (!condition) {
      console.error(`❌ ASSERTION FAILED: ${message}`);
      failed = true;
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  // ── 1. Row counts ──────────────────────────────────────────────────────────
  const [labCount, providerCount, modelCount, modelProviderCount, benchmarkCount, scoreCount] =
    await Promise.all([
      prisma.lab.count(),
      prisma.provider.count(),
      prisma.model.count(),
      prisma.modelProvider.count(),
      prisma.benchmark.count(),
      prisma.benchmarkScore.count(),
    ]);

  console.log("📊 Summary Table (Row Counts):");
  console.log(`  • Labs:            ${labCount}`);
  console.log(`  • Providers:       ${providerCount}`);
  console.log(`  • Models:          ${modelCount}`);
  console.log(`  • ModelProviders:  ${modelProviderCount}`);
  console.log(`  • Benchmarks:      ${benchmarkCount}`);
  console.log(`  • BenchmarkScores: ${scoreCount}`);
  console.log();

  assert(labCount > 0, `Labs count > 0 (got ${labCount})`);
  assert(providerCount > 0, `Providers count > 0 (got ${providerCount})`);
  assert(modelCount > 0, `Models count > 0 (got ${modelCount})`);
  assert(modelProviderCount > 0, `ModelProviders count > 0 (got ${modelProviderCount})`);
  assert(benchmarkCount > 0, `Benchmarks count > 0 (got ${benchmarkCount})`);
  assert(scoreCount > 0, `BenchmarkScores count > 0 (got ${scoreCount})`);
  console.log();

  // ── 2. Every non-deprecated model has providerCount >= 1 ───────────────────
  const zeroProviderActiveModels = await prisma.model.count({
    where: {
      isDeprecated: false,
      providerCount: { lt: 1 },
    },
  });
  assert(
    zeroProviderActiveModels === 0,
    `Every non-deprecated model has providerCount >= 1 (found ${zeroProviderActiveModels} active models with 0 providers)`
  );

  // ── 3. No priced row has NaN or negative price ────────────────────────────
  const negativeOrNanPrices = await prisma.modelProvider.count({
    where: {
      OR: [
        { inputPrice: { lt: 0 } },
        { outputPrice: { lt: 0 } },
        { cacheReadPrice: { lt: 0 } },
        { cacheWritePrice: { lt: 0 } },
      ],
    },
  });
  assert(
    negativeOrNanPrices === 0,
    `No ModelProvider row has negative prices (found ${negativeOrNanPrices})`
  );

  // ── 4. blendedPrice within [min(input,output), max(input,output)] ──────────
  const pricedModels = await prisma.model.findMany({
    where: {
      blendedPrice: { not: null },
      minInputPrice: { not: null },
      minOutputPrice: { not: null },
    },
    select: {
      sourceId: true,
      blendedPrice: true,
      minInputPrice: true,
      minOutputPrice: true,
    },
  });

  let blendedPriceViolations = 0;
  for (const m of pricedModels) {
    const minBound = Math.min(m.minInputPrice!, m.minOutputPrice!) - 1e-4;
    const maxBound = Math.max(m.minInputPrice!, m.minOutputPrice!) + 1e-4;
    if (m.blendedPrice! < minBound || m.blendedPrice! > maxBound) {
      blendedPriceViolations++;
      console.error(
        `  ⚠️  Price out of bounds for ${m.sourceId}: blended=${m.blendedPrice}, bounds=[${minBound.toFixed(4)}, ${maxBound.toFixed(4)}]`
      );
    }
  }
  assert(
    blendedPriceViolations === 0,
    `blendedPrice is within [min(input,output), max(input,output)] for all priced models (${pricedModels.length} checked, ${blendedPriceViolations} violations)`
  );

  // ── 5. compositeScore within [0, 100] ─────────────────────────────────────
  const scoredModels = await prisma.model.findMany({
    where: { compositeScore: { not: null } },
    select: { sourceId: true, compositeScore: true },
  });
  const invalidScores = scoredModels.filter(
    (m) => m.compositeScore! < 0 || m.compositeScore! > 100 || isNaN(m.compositeScore!)
  );
  assert(
    invalidScores.length === 0,
    `compositeScore is within [0, 100] for all scored models (${scoredModels.length} models checked)`
  );

  // ── 6. No BenchmarkScore without sourceUrl & valid ranges ─────────────────
  const missingSourceUrls = await prisma.benchmarkScore.count({
    where: {
      OR: [
        { sourceUrl: "" },
        { sourceUrl: { not: { startsWith: "http" } } },
      ],
    },
  });
  assert(
    missingSourceUrls === 0,
    `No BenchmarkScore without valid sourceUrl (found ${missingSourceUrls})`
  );

  const allScoresWithBenchmark = await prisma.benchmarkScore.findMany({
    include: { benchmark: { select: { slug: true, unit: true } } },
  });
  let outOfRangeScores = 0;
  for (const s of allScoresWithBenchmark) {
    if (s.score < 0 || isNaN(s.score)) {
      outOfRangeScores++;
    } else if (s.benchmark.slug === "arena-elo") {
      if (s.score < 500 || s.score > 2000) outOfRangeScores++;
    } else {
      // 0-100% or 0-100 index benchmarks
      if (s.score > 100) outOfRangeScores++;
    }
  }
  assert(
    outOfRangeScores === 0,
    `All BenchmarkScore values within valid ranges (${allScoresWithBenchmark.length} scores checked, ${outOfRangeScores} violations)`
  );

  // ── 7. No orphan ModelProvider rows ────────────────────────────────────────
  const [orphanModelRows, orphanProviderRows] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "ModelProvider" mp
      LEFT JOIN "Model" m ON mp."modelId" = m.id
      WHERE m.id IS NULL
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "ModelProvider" mp
      LEFT JOIN "Provider" p ON mp."providerId" = p.id
      WHERE p.id IS NULL
    `,
  ]);
  const orphanCount =
    Number(orphanModelRows[0]?.count ?? 0) +
    Number(orphanProviderRows[0]?.count ?? 0);

  assert(
    orphanCount === 0,
    `No orphan ModelProvider rows (found ${orphanCount} orphans)`
  );

  // ── 8. Slugs are unique and URL-safe ───────────────────────────────────────
  const allModels = await prisma.model.findMany({ select: { slug: true } });
  const slugSet = new Set<string>();
  let duplicateSlugs = 0;
  let unsafeSlugs = 0;
  // RFC 3986 unreserved URL-safe characters in lowercase: a-z, 0-9, -, _, .
  const urlSafePattern = /^[a-z0-9-_.]+$/;

  for (const m of allModels) {
    if (slugSet.has(m.slug)) duplicateSlugs++;
    slugSet.add(m.slug);
    if (!urlSafePattern.test(m.slug)) {
      unsafeSlugs++;
      console.error(`  ⚠️  Unsafe slug: "${m.slug}"`);
    }
  }
  assert(
    duplicateSlugs === 0 && unsafeSlugs === 0,
    `Slugs are unique and URL-safe (${allModels.length} models: ${duplicateSlugs} duplicates, ${unsafeSlugs} unsafe)`
  );

  // ── 9. Score Basis Integrity (No mixed-basis scores) ────────────────────────
  const modelsWithBasis = await prisma.model.findMany({
    where: {
      OR: [
        { scoreBasis: { not: null } },
        { compositeScore: { not: null } },
        { intelligenceScore: { not: null } },
      ],
    },
    include: {
      benchmarkScores: {
        include: { benchmark: { select: { slug: true } } },
      },
    },
  });

  let basisViolations = 0;
  for (const m of modelsWithBasis) {
    const aaIntel = m.benchmarkScores.find(
      (b) => b.benchmark.slug === "intelligence-index"
    );

    if (m.scoreBasis === "aa") {
      if (!aaIntel) {
        console.error(`  ⚠️  Model ${m.sourceId} has scoreBasis="aa" but no AA intelligence-index`);
        basisViolations++;
      }
      if (m.compositeScore !== aaIntel?.score || m.intelligenceScore !== aaIntel?.score) {
        console.error(
          `  ⚠️  Model ${m.sourceId} has scoreBasis="aa" but compositeScore (${m.compositeScore}) or intelligenceScore (${m.intelligenceScore}) does not match AA index (${aaIntel?.score})`
        );
        basisViolations++;
      }
    } else if (m.scoreBasis === "vendor") {
      if (aaIntel) {
        console.error(`  ⚠️  Model ${m.sourceId} has scoreBasis="vendor" but contains an AA intelligence-index`);
        basisViolations++;
      }
    } else if (m.scoreBasis === null) {
      if (m.compositeScore !== null || m.intelligenceScore !== null) {
        console.error(
          `  ⚠️  Model ${m.sourceId} has scoreBasis=null but has compositeScore (${m.compositeScore}) or intelligenceScore (${m.intelligenceScore})`
        );
        basisViolations++;
      }
    } else {
      console.error(`  ⚠️  Model ${m.sourceId} has invalid scoreBasis: "${m.scoreBasis}"`);
      basisViolations++;
    }
  }

  assert(
    basisViolations === 0,
    `No model has mixed-basis or corrupted scoreBasis (${modelsWithBasis.length} scored models checked, ${basisViolations} violations)`
  );

  console.log("\n--------------------------------------------------");
  console.log("               Spot Checks & Eyeball              ");
  console.log("--------------------------------------------------\n");

  // Top 5 cheapest models (non-zero blended price)
  const cheapest5 = await prisma.model.findMany({
    where: { blendedPrice: { gt: 0 }, isDeprecated: false },
    orderBy: { blendedPrice: "asc" },
    take: 5,
    select: {
      sourceId: true,
      blendedPrice: true,
      cheapestProviderName: true,
      providerCount: true,
    },
  });
  console.log("💸 Top 5 Cheapest Models (Blended Price USD / 1M tokens):");
  for (const m of cheapest5) {
    console.log(
      `  • ${m.sourceId.padEnd(42)} $${m.blendedPrice?.toFixed(4).padStart(8)} (via ${m.cheapestProviderName ?? "default"}, ${m.providerCount} providers)`
    );
  }

  // Top 5 largest-context models
  const largestContext5 = await prisma.model.findMany({
    where: { contextWindow: { not: null }, isDeprecated: false },
    orderBy: { contextWindow: "desc" },
    take: 5,
    select: {
      sourceId: true,
      contextWindow: true,
      providerCount: true,
    },
  });
  console.log("\n📚 Top 5 Largest-Context Models:");
  for (const m of largestContext5) {
    const tokens = m.contextWindow?.toLocaleString().padStart(12) ?? "N/A";
    console.log(`  • ${m.sourceId.padEnd(42)} ${tokens} tokens (${m.providerCount} providers)`);
  }

  // 5 models with the most providers
  const mostProviders5 = await prisma.model.findMany({
    where: { isDeprecated: false },
    orderBy: { providerCount: "desc" },
    take: 5,
    select: {
      sourceId: true,
      providerCount: true,
      blendedPrice: true,
    },
  });
  console.log("\n🌐 Top 5 Models with Most Providers:");
  for (const m of mostProviders5) {
    console.log(
      `  • ${m.sourceId.padEnd(42)} ${String(m.providerCount).padStart(2)} providers (blended $${m.blendedPrice?.toFixed(4) ?? "N/A"})`
    );
  }

  // Models with composite scores summary
  const scoredSummary = await prisma.model.findMany({
    where: { compositeScore: { not: null } },
    orderBy: { compositeScore: "desc" },
    select: {
      sourceId: true,
      compositeScore: true,
      intelligenceScore: true,
      codingScore: true,
    },
  });
  console.log(`\n🏆 Models with Composite Scores (${scoredSummary.length} total):`);
  for (const m of scoredSummary) {
    console.log(
      `  • ${m.sourceId.padEnd(38)} Composite: ${m.compositeScore?.toFixed(1).padStart(5)} | Intel: ${m.intelligenceScore?.toFixed(1).padStart(5) ?? "  N/A"} | Coding: ${m.codingScore?.toFixed(1).padStart(5) ?? "  N/A"}`
    );
  }

  // ── Coverage Metric ───────────────────────────────────────────────────────
  const listableModelsCount = await prisma.model.count({
    where: { isDeprecated: false, providerCount: { gte: 1 } },
  });
  const scoredListableModelsCount = await prisma.model.count({
    where: {
      isDeprecated: false,
      providerCount: { gte: 1 },
      benchmarkScores: { some: {} },
    },
  });
  console.log(
    `\n📈 Benchmark Coverage: ${scoredListableModelsCount} of ${listableModelsCount} listable models have scores (${((scoredListableModelsCount / listableModelsCount) * 100).toFixed(1)}%)`
  );


  console.log("\n==================================================");
  if (failed) {
    console.error("❌ INTEGRITY VERIFICATION FAILED: see errors above.");
    process.exit(1);
  } else {
    console.log("✅ ALL DATA INTEGRITY ASSERTIONS PASSED.");
    console.log("==================================================");
  }
}

main()
  .catch((err) => {
    console.error("Fatal verification error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
