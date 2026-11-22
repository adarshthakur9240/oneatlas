// scripts/test-cost-pareto.ts
import { estimateMonthlyCost } from "../src/lib/cost";
import { paretoFrontier, ParetoPoint } from "../src/lib/pareto";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

console.log("\n========================================");
console.log("🧪 Testing Cost Calculation & Pareto Frontier");
console.log("========================================\n");

// --- 1. Cost Estimator Tests ---
console.log("1. Testing estimateMonthlyCost:");

// Scenario A: 100k requests, 2k in, 500 out, $3 in, $15 out, no cache
const resA = estimateMonthlyCost({
  inputTokensPerRequest: 2000,
  outputTokensPerRequest: 500,
  requestsPerMonth: 100000,
  inputPrice: 3.0,
  outputPrice: 15.0,
});
// Total input = 200,000,000 tokens => $600
// Total output = 50,000,000 tokens => $750
// Total cost = $1,350
assert(resA.totalInputTokens === 200_000_000, "Calculates 200M input tokens");
assert(resA.totalOutputTokens === 50_000_000, "Calculates 50M output tokens");
assert(resA.inputCost === 600, `Input cost should be $600, got ${resA.inputCost}`);
assert(resA.outputCost === 750, `Output cost should be $750, got ${resA.outputCost}`);
assert(resA.totalCost === 1350, `Total cost should be $1,350, got ${resA.totalCost}`);
assert(resA.cacheSavings === 0, "No cache savings when hit rate is 0");

// Scenario B: With 50% cache hit rate and $0.30 cache read price
const resB = estimateMonthlyCost({
  inputTokensPerRequest: 2000,
  outputTokensPerRequest: 500,
  requestsPerMonth: 100000,
  cacheHitPercent: 50,
  inputPrice: 3.0,
  outputPrice: 15.0,
  cacheReadPrice: 0.3,
});
// Cached tokens = 100M => 100 * 0.3 = $30
// Uncached tokens = 100M => 100 * 3.0 = $300
// Input cost = $330 (vs baseline $600, savings = $270)
// Output cost = $750
// Total cost = $1080
assert(resB.cachedInputTokens === 100_000_000, "Cached tokens 100M");
assert(resB.uncachedInputTokens === 100_000_000, "Uncached tokens 100M");
assert(resB.inputCost === 330, `Input cost should be $330, got ${resB.inputCost}`);
assert(resB.cacheSavings === 270, `Cache savings should be $270, got ${resB.cacheSavings}`);
assert(resB.totalCost === 1080, `Total cost should be $1080, got ${resB.totalCost}`);

// --- 2. Pareto Frontier Tests ---
console.log("\n2. Testing paretoFrontier:");

const testModels: ParetoPoint[] = [
  { slug: "cheap-weak", name: "Model A", price: 0.1, score: 50 },
  { slug: "dominated-1", name: "Model B", price: 0.2, score: 45 }, // dominated by A (more expensive & worse)
  { slug: "good-value", name: "Model C", price: 0.5, score: 75 }, // beats A on score
  { slug: "dominated-2", name: "Model D", price: 1.0, score: 70 }, // dominated by C
  { slug: "high-end", name: "Model E", price: 2.0, score: 90 }, // beats C on score
  { slug: "overpriced", name: "Model F", price: 5.0, score: 88 }, // dominated by E
  { slug: "free-model", name: "Model Zero", price: 0.0, score: 35 }, // free baseline
];

const frontier = paretoFrontier(testModels);
const frontierSlugs = frontier.map((p) => p.slug);

assert(frontierSlugs.includes("free-model"), "Free model (price 0) is on frontier");
assert(frontierSlugs.includes("cheap-weak"), "cheap-weak is on frontier");
assert(frontierSlugs.includes("good-value"), "good-value is on frontier");
assert(frontierSlugs.includes("high-end"), "high-end is on frontier");
assert(!frontierSlugs.includes("dominated-1"), "dominated-1 is excluded");
assert(!frontierSlugs.includes("dominated-2"), "dominated-2 is excluded");
assert(!frontierSlugs.includes("overpriced"), "overpriced is excluded");
assert(frontier.length === 4, `Frontier has exactly 4 models, got ${frontier.length}`);

// Verify monotonic increasing scores along the frontier
for (let i = 0; i < frontier.length - 1; i++) {
  assert(
    frontier[i].price < frontier[i + 1].price,
    `Frontier prices strictly ascending: ${frontier[i].price} < ${frontier[i + 1].price}`
  );
  assert(
    frontier[i].score < frontier[i + 1].score,
    `Frontier scores strictly ascending: ${frontier[i].score} < ${frontier[i + 1].score}`
  );
}

console.log(`\n========================================`);
console.log(`📊 Test Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
