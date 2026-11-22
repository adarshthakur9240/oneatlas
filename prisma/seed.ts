// prisma/seed.ts
// Main seed entry point — runs catalog ingest, then benchmark ingest
import { ingestCatalog } from "./seed/ingest";
import { ingestBenchmarks } from "./seed/benchmarks";
import { ingestArtificialAnalysis } from "./seed/artificial-analysis";
import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  console.log("🌱 OneAtlas seed starting...\n");

  const refresh = process.argv.includes("--refresh");
  const runAa = process.argv.includes("--aa");
  const dryRun = process.argv.includes("--dry-run");
  const refreshAa = process.argv.includes("--refresh-aa");
  const limit = (() => {
    const idx = process.argv.indexOf("--limit");
    if (idx !== -1 && process.argv[idx + 1]) {
      return parseInt(process.argv[idx + 1]!, 10);
    }
    return undefined;
  })();

  if (refresh) console.log("🔄 Cache refresh mode: ON");
  if (runAa) console.log("📊 Artificial Analysis ingest: ENABLED (--aa)");
  if (dryRun) console.log("🔍 Dry run mode: ON (no writes)");
  if (limit) console.log(`📏 Limit: ${limit} models`);

  if (!dryRun) {
    await ingestCatalog({ refresh, limit });
    console.log();
    await ingestBenchmarks();
  }

  // Artificial Analysis ingest (OPT-IN with --aa)
  if (runAa) {
    console.log();
    await ingestArtificialAnalysis({ refresh: refreshAa, dryRun });
  }

  console.log("\n✅ Seed complete.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

