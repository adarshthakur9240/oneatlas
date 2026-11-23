// src/lib/formatters.ts
// Pure utility functions for formatting prices, token limits, dates, and scores

/**
 * Formats a USD price per 1M tokens with adaptive decimals.
 * Examples: $0.28, $0.003, Free, —
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "—";
  if (price === 0) return "Free";

  if (price < 0.001) {
    const s = price.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    return `$${s}`;
  }

  if (price < 0.01) {
    return `$${price.toFixed(4)}`;
  }

  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats token count into human-readable compact notation (e.g. 33K, 262K, 1M, 2M)
 */
export function formatContext(tokens: number | null | undefined): string {
  if (tokens === null || tokens === undefined) return "—";
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K`;
  }
  return `${tokens}`;
}

/**
 * Formats a date string into "MMM D, YYYY" (e.g. "Nov 7, 2026")
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Formats integer with thousands separator (e.g. 1,358)
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "—";
  return num.toLocaleString("en-US");
}

/**
 * Formats score with single decimal place (e.g. 89.2)
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "—";
  return score.toFixed(1);
}

/**
 * Human-readable relative time difference
 */
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
}

/**
 * Strips ANY leading "<Prefix>: " from model names
 * (e.g. "SpaceXSI: Grok 4.7" -> "Grok 4.7", "OpenAI: o3" -> "o3", "Anthropic: Claude 3.5 Sonnet" -> "Claude 3.5 Sonnet")
 */
export function displayName(
  model:
    | {
        name: string;
        lab?: { name?: string | null; slug?: string | null } | null;
      }
    | string
    | null
    | undefined
): string {
  if (!model) return "";
  const rawName = typeof model === "string" ? model : model.name;
  if (!rawName) return "";
  const name = rawName.trim();

  // Strip ANY leading "<Prefix>: " where there is content after the colon
  const colonIndex = name.indexOf(":");
  if (colonIndex > 0) {
    const after = name.slice(colonIndex + 1).trim();
    if (after) {
      return after;
    }
  }

  return name;
}
