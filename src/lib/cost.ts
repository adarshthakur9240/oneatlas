// src/lib/cost.ts
// Pure utility functions for calculating monthly model inference costs and cache savings

export interface CostCalculationInput {
  inputTokensPerRequest: number; // e.g. 2,000
  outputTokensPerRequest: number; // e.g. 500
  requestsPerMonth: number; // e.g. 100,000
  cacheHitPercent?: number; // 0 to 100 (default 0)
  inputPrice: number; // USD per 1M tokens
  outputPrice: number; // USD per 1M tokens
  cacheReadPrice?: number | null; // USD per 1M tokens
}

export interface CostCalculationResult {
  inputCost: number; // Monthly input cost in USD
  outputCost: number; // Monthly output cost in USD
  totalCost: number; // Total monthly cost in USD
  cacheSavings: number; // Monthly savings from cache hits in USD
  blendedPricePer1M: number; // Effective blended USD per 1M tokens
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
  uncachedInputTokens: number;
}

/**
 * Pure function to estimate monthly API inference cost.
 * All token prices are assumed in USD per 1,000,000 tokens.
 */
export function estimateMonthlyCost(
  params: CostCalculationInput
): CostCalculationResult {
  const {
    inputTokensPerRequest,
    outputTokensPerRequest,
    requestsPerMonth,
    cacheHitPercent = 0,
    inputPrice,
    outputPrice,
    cacheReadPrice,
  } = params;

  const validRequests = Math.max(0, requestsPerMonth);
  const totalInputTokens = validRequests * Math.max(0, inputTokensPerRequest);
  const totalOutputTokens = validRequests * Math.max(0, outputTokensPerRequest);
  const totalTokens = totalInputTokens + totalOutputTokens;

  const clampedHitRate = Math.min(100, Math.max(0, cacheHitPercent)) / 100;
  const cachedInputTokens = Math.round(totalInputTokens * clampedHitRate);
  const uncachedInputTokens = totalInputTokens - cachedInputTokens;

  // Uncached baseline input cost
  const baselineInputCost = (totalInputTokens / 1_000_000) * inputPrice;

  // Actual input cost factoring in cacheReadPrice if available
  let inputCost = baselineInputCost;
  let cacheSavings = 0;

  if (
    cacheReadPrice !== null &&
    cacheReadPrice !== undefined &&
    clampedHitRate > 0
  ) {
    const uncachedCost = (uncachedInputTokens / 1_000_000) * inputPrice;
    const cachedCost = (cachedInputTokens / 1_000_000) * cacheReadPrice;
    inputCost = uncachedCost + cachedCost;
    cacheSavings = Math.max(0, baselineInputCost - inputCost);
  }

  const outputCost = (totalOutputTokens / 1_000_000) * outputPrice;
  const totalCost = inputCost + outputCost;

  const blendedPricePer1M =
    totalTokens > 0 ? (totalCost / totalTokens) * 1_000_000 : 0;

  return {
    inputCost: Math.round(inputCost * 100) / 100,
    outputCost: Math.round(outputCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    cacheSavings: Math.round(cacheSavings * 100) / 100,
    blendedPricePer1M: Math.round(blendedPricePer1M * 1000) / 1000,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    cachedInputTokens,
    uncachedInputTokens,
  };
}
