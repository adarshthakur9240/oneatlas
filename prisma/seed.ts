// prisma/seed.ts
// Main seed entry point — runs catalog ingest, then benchmark ingest
import { ingestCatalog } from "./seed/ingest";
import { ingestBenchmarks } from "./seed/benchmarks";
import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  console.log("🌱 OneAtlas seed starting...\n");

  const refresh = process.argv.includes("--refresh");
  const limit = (() => {
    const idx = process.argv.indexOf("--limit");
    if (idx !== -1 && process.argv[idx + 1]) {
      return parseInt(process.argv[idx + 1]!, 10);
    }
    return undefined;
  })();

  if (refresh) console.log("🔄 Cache refresh mode: ON");
  if (limit) console.log(`📏 Limit: ${limit} models`);

  await ingestCatalog({ refresh, limit });
  console.log();
  await ingestBenchmarks();

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
