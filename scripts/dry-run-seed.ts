// scripts/dry-run-seed.ts
// Dry-run preview of derived score and scoreBasis changes across all models

import { prisma } from "../src/lib/prisma";
import { recomputeDerivedScores } from "../prisma/seed/benchmarks";

async function main() {
  console.log("🔍 Computing dry-run of derived scores and scoreBasis...\n");
  const result = await recomputeDerivedScores({ dryRun: true });

  const aaModels = result.changes.filter((c) => c.new.scoreBasis === "aa");
  const vendorModels = result.changes.filter((c) => c.new.scoreBasis === "vendor");
  const unclassified = result.changes.filter((c) => c.new.scoreBasis === null);
  const changed = result.changes.filter((c) => c.changed);

  console.log("\n========================================================");
  console.log("            SEED DERIVATION DRY-RUN SUMMARY             ");
  console.log("========================================================");
  console.log(`Total models with benchmark scores: ${result.changes.length}`);
  console.log(`- AA basis models ("aa"):           ${aaModels.length}`);
  console.log(`- Vendor basis models ("vendor"):   ${vendorModels.length}`);
  console.log(`- Unclassified models (null basis): ${unclassified.length}`);
  console.log(`- Total models that will change:    ${changed.length}`);
  console.log("========================================================\n");

  console.log("Model-by-Model Changes Breakdown:");
  console.log(
    "Slug".padEnd(36) +
      " | " +
      "Basis".padEnd(16) +
      " | " +
      "Composite".padEnd(15) +
      " | " +
      "Intelligence".padEnd(15) +
      " | " +
      "Coding"
  );
  console.log("-".repeat(105));

  for (const c of changed) {
    const basisStr = `${String(c.old.scoreBasis)} -> ${String(c.new.scoreBasis)}`;
    const compStr = `${String(c.old.compositeScore ?? "—")} -> ${String(c.new.compositeScore ?? "—")}`;
    const intelStr = `${String(c.old.intelligenceScore ?? "—")} -> ${String(c.new.intelligenceScore ?? "—")}`;
    const codingStr = `${String(c.old.codingScore ?? "—")} -> ${String(c.new.codingScore ?? "—")}`;

    console.log(
      `${c.slug.padEnd(36)} | ${basisStr.padEnd(16)} | ${compStr.padEnd(15)} | ${intelStr.padEnd(15)} | ${codingStr}`
    );
  }
}

main()
  .catch((err) => {
    console.error("❌ Dry-run failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
