// src/app/rankings/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { RankingsClient } from "@/components/rankings/RankingsClient";

export const metadata: Metadata = {
  title: "AI Model Rankings & Leaderboard | OneAtlas",
  description:
    "Explore AI model intelligence rankings across MMLU-Pro, SWE-bench Verified, GPQA Diamond, and LiveCodeBench with Pareto frontier cost-benefit tradeoffs.",
};

export default function RankingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="text-xs font-mono text-muted animate-pulse">
            Loading intelligence rankings...
          </span>
        </div>
      }
    >
      <RankingsClient />
    </Suspense>
  );
}
