// scripts/e2e-smoke.ts
// Comprehensive end-to-end page smoke test suite
// Verifies HTTP 200 on all pages and HTTP 404 on invalid slugs

export {};

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

interface PageTestResult {
  name: string;
  path: string;
  status: number;
  expectedStatus: number;
  durationMs: number;
  passed: boolean;
  error?: string;
}

const pageResults: PageTestResult[] = [];

async function testPage(
  name: string,
  path: string,
  expectedStatus: number = 200,
  contentCheck?: (html: string) => boolean
) {
  const url = `${BASE_URL}${path}`;
  const start = performance.now();
  try {
    const res = await fetch(url);
    const durationMs = Math.round(performance.now() - start);
    const html = await res.text();

    // In Next.js streaming with loading.tsx, notFound() streams the 404 boundary
    const isStreamed404 =
      expectedStatus === 404 &&
      (res.status === 404 ||
        (res.status === 200 &&
          (html.includes("NEXT_HTTP_ERROR_FALLBACK;404") ||
            html.includes("Model not found") ||
            html.includes("Lab not found") ||
            html.includes("Provider not found") ||
            html.includes("Page not found"))));

    const statusMatch = res.status === expectedStatus || isStreamed404;
    const contentMatch = contentCheck ? contentCheck(html) : true;

    if (!statusMatch) {
      throw new Error(`Expected HTTP ${expectedStatus}, received ${res.status}`);
    }
    if (!contentMatch) {
      throw new Error(`Page body content check failed`);
    }

    pageResults.push({
      name,
      path,
      status: res.status,
      expectedStatus,
      durationMs,
      passed: true,
    });
    console.log(`  ✓ [${durationMs}ms] ${name} (HTTP ${res.status})`);
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    const msg = err instanceof Error ? err.message : String(err);
    pageResults.push({
      name,
      path,
      status: -1,
      expectedStatus,
      durationMs,
      passed: false,
      error: msg,
    });
    console.error(`  ✗ [${durationMs}ms] ${name}: ${msg}`);
  }
}

async function runE2ESuite() {
  console.log("\n========================================");
  console.log("🌐 Starting OneAtlas E2E Page Smoke Test");
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log("========================================\n");

  // Fetch real slugs from API
  console.log("Fetching real catalog slugs...");
  const [modelsRes, labsRes, providersRes, presetsRes] = await Promise.all([
    fetch(`${BASE_URL}/api/models?limit=5`).then((r) => r.json()),
    fetch(`${BASE_URL}/api/labs`).then((r) => r.json()),
    fetch(`${BASE_URL}/api/providers`).then((r) => r.json()),
    fetch(`${BASE_URL}/api/compare/presets`).then((r) => r.json()),
  ]);

  const sampleModel = modelsRes.data?.[0]?.slug || "anthropic-claude-3.5-sonnet";
  const secondModel = modelsRes.data?.[1]?.slug || "openai-gpt-4o";
  const sampleLab = labsRes.data?.[0]?.slug || "anthropic";
  const sampleProvider = providersRes.data?.[0]?.slug || "together";
  const presetSlugs = presetsRes.data?.[0]?.modelSlugs?.join(",") || `${sampleModel},${secondModel}`;

  console.log(`  Model slug: ${sampleModel}`);
  console.log(`  Lab slug: ${sampleLab}`);
  console.log(`  Provider slug: ${sampleProvider}`);
  console.log(`  Compare preset slugs: ${presetSlugs}\n`);

  // 1. Home Page
  await testPage("Home Page (/)", "/", 200, (html) => html.includes("OneAtlas"));

  // 2. Model Detail Page
  await testPage(
    `Model Detail (/models/${sampleModel})`,
    `/models/${sampleModel}`,
    200,
    (html) => html.includes("Interactive Cost Calculator") && html.includes("Inference Providers")
  );

  // 3. Compare Page with 3 slugs
  await testPage(
    `Compare Page (/compare?models=${presetSlugs})`,
    `/compare?models=${presetSlugs}`,
    200,
    (html) => html.includes("Compare AI Models")
  );

  // 4. Rankings Pages
  await testPage(
    "Rankings - Composite (/rankings)",
    "/rankings",
    200,
    (html) => html.includes("AI Model Rankings")
  );
  await testPage(
    "Rankings - SWE-bench (/rankings?benchmark=swe-bench-verified)",
    "/rankings?benchmark=swe-bench-verified",
    200
  );
  await testPage(
    "Rankings - MMLU-Pro (/rankings?benchmark=mmlu-pro)",
    "/rankings?benchmark=mmlu-pro",
    200
  );

  // 5. Benchmarks Page
  await testPage(
    "Benchmarks Page (/benchmarks)",
    "/benchmarks",
    200,
    (html) => html.includes("AI Benchmarks") && html.includes("Evaluation Methodology")
  );

  // 6. Labs Pages
  await testPage(
    "Labs Directory (/labs)",
    "/labs",
    200,
    (html) => html.includes("AI Research Labs")
  );
  await testPage(
    `Lab Detail (/labs/${sampleLab})`,
    `/labs/${sampleLab}`,
    200,
    (html) => html.includes("Release Timeline") || html.includes("Models by")
  );

  // 7. Providers Pages
  await testPage(
    "Providers Directory (/providers)",
    "/providers",
    200,
    (html) => html.includes("Inference Providers")
  );
  await testPage(
    `Provider Detail (/providers/${sampleProvider})`,
    `/providers/${sampleProvider}`,
    200,
    (html) => html.includes("Hosted Endpoints")
  );

  // 8. 404 Pages for Non-Existent Slugs
  await testPage(
    "Model 404 (/models/non-existent-xyz)",
    "/models/non-existent-xyz",
    404,
    (html) => html.includes("404") || html.includes("not found")
  );
  await testPage(
    "Lab 404 (/labs/non-existent-xyz)",
    "/labs/non-existent-xyz",
    404,
    (html) => html.includes("404") || html.includes("not found")
  );
  await testPage(
    "Provider 404 (/providers/non-existent-xyz)",
    "/providers/non-existent-xyz",
    404,
    (html) => html.includes("404") || html.includes("not found")
  );

  // Summary
  const passed = pageResults.filter((r) => r.passed).length;
  const failed = pageResults.filter((r) => !r.passed).length;
  const total = pageResults.length;

  console.log("\n========================================");
  console.log(`📊 E2E Page Smoke Summary: ${passed}/${total} passed (${failed} failed)`);
  console.log("========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ESuite().catch((err) => {
  console.error("Fatal E2E test runner error:", err);
  process.exit(1);
});
