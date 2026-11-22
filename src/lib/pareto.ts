// src/lib/pareto.ts
// Pure utility for computing the 2D Pareto frontier (skyline) of model intelligence vs. price

export interface ParetoPoint {
  id?: string;
  slug: string;
  name: string;
  lab?: string;
  price: number; // Blended price in USD/1M tokens
  score: number; // Intelligence or benchmark score (0-100)
  isFree?: boolean;
}

/**
 * Computes the Pareto efficient frontier in O(n log n) time.
 * In our tradeoff space:
 * - We minimize price (cheaper is better).
 * - We maximize score (higher intelligence is better).
 *
 * A point A dominates point B if:
 *   price(A) <= price(B) AND score(A) >= score(B), with at least one strict inequality.
 *
 * Algorithm:
 * 1. Filter out points with invalid/null price or score.
 * 2. Sort points by price ASC. For ties in price, sort by score DESC so the superior point comes first.
 * 3. Linear sweep: keep a point if its score strictly exceeds the maximum score seen so far.
 *
 * Time complexity: O(n log n) for sorting + O(n) for linear sweep = O(n log n).
 * Space complexity: O(n) for result array.
 */
export function paretoFrontier<T extends ParetoPoint>(points: T[]): T[] {
  if (!points || points.length === 0) return [];

  // Filter valid coordinates
  const valid = points.filter(
    (p) =>
      typeof p.price === "number" &&
      !isNaN(p.price) &&
      p.price >= 0 &&
      typeof p.score === "number" &&
      !isNaN(p.score) &&
      p.score >= 0
  );

  if (valid.length === 0) return [];

  // Sort by price ascending; on tie, highest score first
  const sorted = [...valid].sort((a, b) => {
    if (a.price !== b.price) {
      return a.price - b.price;
    }
    return b.score - a.score;
  });

  const frontier: T[] = [];
  let maxScoreSeen = -Infinity;

  for (const point of sorted) {
    // If this point strictly beats all cheaper options, it belongs on the frontier
    if (point.score > maxScoreSeen) {
      frontier.push(point);
      maxScoreSeen = point.score;
    }
  }

  return frontier;
}
