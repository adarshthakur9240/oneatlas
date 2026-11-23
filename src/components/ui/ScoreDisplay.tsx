// src/components/ui/ScoreDisplay.tsx
import * as React from "react";
import { formatScore } from "@/lib/formatters";

interface ScoreDisplayProps {
  score: number | null | undefined;
  scoreBasis?: "aa" | "vendor" | string | null;
  className?: string;
  unit?: string;
}

/**
 * Renders an intelligence or benchmark score.
 * If scoreBasis === "vendor", displays a dagger "†" with a tooltip
 * indicating that it is vendor-reported and not comparable to the AA Index.
 */
export function ScoreDisplay({
  score,
  scoreBasis,
  className,
  unit,
}: ScoreDisplayProps) {
  if (score === null || score === undefined || isNaN(score)) {
    return <span className="text-muted/40">—</span>;
  }

  const isVendor = scoreBasis === "vendor";

  return (
    <span className={`inline-flex items-baseline ${className || ""}`}>
      <span className="tabular-nums">{formatScore(score)}</span>
      {unit && <span className="text-muted text-xs ml-0.5">{unit}</span>}
      {isVendor && (
        <span
          title="vendor-reported, not comparable to the AA Index"
          aria-label="vendor-reported, not comparable to the AA Index"
          className="text-accent-warn font-mono text-[10px] ml-0.5 cursor-help select-none hover:text-accent-warn/80"
        >
          †
        </span>
      )}
    </span>
  );
}
