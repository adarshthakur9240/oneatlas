// src/app/benchmarks/page.tsx
// Server Component for Benchmarks Catalog & Evaluation Methodology

import Link from "next/link";
import type { Metadata } from "next";
import { listBenchmarks } from "@/server/services/benchmarks";
import { displayName, formatScore } from "@/lib/formatters";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Award, ArrowRight, ShieldCheck, Scale, FileCode, CheckCircle2 } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Benchmarks & Evaluation Methodology | OneAtlas",
  description:
    "Explore AI benchmark suites including MMLU-Pro, SWE-bench Verified, GPQA Diamond, and understand our empirical scoring and normalization methodology.",
};

export default async function BenchmarksPage() {
  const benchmarks = await listBenchmarks();

  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Header */}
        <div className="pb-6 border-b border-border">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted mb-2">
            <Award className="w-3.5 h-3.5 text-accent-warn" />
            <span>Benchmark Index &amp; Standards</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text tracking-tight">
            AI Benchmarks
          </h1>
          <p className="text-sm text-muted mt-2 max-w-2xl font-sans">
            Independent evaluations, reasoning tests, and coding challenges used to measure state-of-the-art model capabilities.
          </p>
        </div>

        {/* Benchmark Cards Grid */}
        <div className="space-y-6">
          <SectionHeader
            title="Standard Evaluation Suites"
            subtitle="Explore standardized test datasets and top 5 model rankings."
            count={benchmarks.length}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benchmarks.map((bm) => (
              <div
                key={bm.id}
                className="bg-surface border border-border rounded-[16px] p-5 flex flex-col justify-between space-y-5 shadow-xs"
              >
                <div className="space-y-3">
                  {/* Category & Coverage */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm bg-surface-raised border border-border text-muted">
                      {bm.category}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      {bm.coverage} models evaluated
                    </span>
                  </div>

                  {/* Benchmark Title & Description */}
                  <div>
                    <h3 className="font-serif text-xl font-normal text-text">
                      {bm.name}
                    </h3>
                    <p className="text-xs text-muted font-sans mt-1 leading-relaxed">
                      {bm.description || "Rigorous empirical evaluation dataset for language and reasoning models."}
                    </p>
                  </div>

                  {/* Top 5 Mini Leaderboard */}
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted mb-1">
                      Top Performers
                    </div>
                    {bm.topModels.length === 0 ? (
                      <div className="text-xs font-mono text-subtle py-2">
                        No scores recorded yet.
                      </div>
                    ) : (
                      bm.topModels.slice(0, 5).map((tm) => (
                        <div
                          key={tm.model.id}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 font-mono text-[11px] text-muted text-center">
                              #{tm.rank}
                            </span>
                            <LabAvatar slug={tm.model.lab.slug} name={tm.model.lab.name} size="sm" />
                            <Link
                              href={`/models/${tm.model.slug}`}
                              className="font-medium text-text hover:underline truncate max-w-[140px]"
                            >
                              {displayName(tm.model)}
                            </Link>
                          </div>
                          <span className="font-mono font-bold text-text tabular-nums">
                            {formatScore(tm.score)}{bm.unit || "%"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer Link to Rankings */}
                <div className="pt-3 border-t border-border/60">
                  <Link href={`/rankings?benchmark=${bm.slug}`}>
                    <Button variant="outline" size="sm" className="w-full justify-between font-mono text-xs">
                      <span>View full ranking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology Section */}
        <div className="bg-surface border border-border rounded-[20px] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Scale className="w-5 h-5 text-accent-warn" />
            <h3 className="font-serif text-2xl font-normal text-text">
              Evaluation Methodology &amp; Scoring Policy
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-xs text-muted leading-relaxed">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-text font-medium text-sm">
                <ShieldCheck className="w-4 h-4 text-[#8fc49a]" />
                <span>Nulls-Over-Guesses Policy</span>
              </div>
              <p>
                We never extrapolate, estimate, or hallucinate benchmark scores. If an evaluation has not been conducted by a verified third party or accompanied by a reproducible evaluation run, the score is left strictly null.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-text font-medium text-sm">
                <FileCode className="w-4 h-4 text-accent-warn" />
                <span>Score Normalization</span>
              </div>
              <p>
                Metrics with differing scales (such as LMSYS Chatbot Arena Elo ratings, typically 1000–1500) are normalized linearly to a 0–100 scale for comparative radar charts and composite indexing, where 1000 Elo maps to 0 and 1500 Elo maps to 100.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-text font-medium text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#8fc49a]" />
                <span>Composite Intelligence Index</span>
              </div>
              <p>
                A model&apos;s Composite Score is computed as the arithmetic mean of at least two verified normalized benchmark scores across general reasoning (MMLU-Pro / GPQA) and software engineering (SWE-bench / LiveCodeBench). Models with fewer than two benchmarks remain unranked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
