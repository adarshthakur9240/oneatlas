// src/lib/pricing.ts
// Pure, unit-testable pricing utility functions

/**
 * Convert OpenRouter's per-token decimal string to USD per 1M tokens.
 * Returns null for invalid/negative values (e.g. "-1" = dynamic routing).
 */
export function perTokenToPerMillion(s: string): number | null {
  const val = parseFloat(s);
  if (isNaN(val) || val < 0) return null;
  return Math.round(val * 1e6 * 1e6) / 1e6; // round to 6 decimals
}

/**
 * Blended price = (3 * input + output) / 4
 * Weights input 3:1 to match typical prompt-heavy workloads.
 * Rounded to 6 decimals.
 */
export function blendedPrice(input: number, output: number): number {
  const price = (3 * input + output) / 4;
  return Math.round(price * 1e6) / 1e6;
}

/**
 * Normalize a benchmark score to 0–100 scale.
 * - Percent benchmarks (mmlu-pro, gpqa-diamond, swe-bench-verified, livecodebench): pass through as-is.
 * - Arena Elo: linearly map [1000, 1500] -> [0, 100], clamped.
 */
export function normalizeBenchmark(slug: string, score: number): number {
  if (slug === "arena-elo") {
    const normalized = ((score - 1000) / (1500 - 1000)) * 100;
    return Math.max(0, Math.min(100, normalized));
  }
  // Percent benchmarks: clamp to [0, 100]
  return Math.max(0, Math.min(100, score));
}
