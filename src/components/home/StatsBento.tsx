// src/components/home/StatsBento.tsx
// Warm cream hero stats card matching oneatlas.dev design language

import { formatNumber } from "@/lib/formatters";
import type { StatsDto } from "@/types/api";

interface StatsBentoProps {
  stats: StatsDto;
}

export function StatsBento({ stats }: StatsBentoProps) {
  const { totals, releasesPerMonth, releasesLast12Months, capabilityCoverage } =
    stats;

  // Find maximum release count to scale chart bars proportionally
  const maxCount = Math.max(...releasesPerMonth.map((r) => r.count), 1);
  const firstMonth = releasesPerMonth[0]?.month || "";
  const lastMonth = releasesPerMonth[releasesPerMonth.length - 1]?.month || "";

  function formatMonthLabel(m: string): string {
    if (!m) return "";
    const [yyyy, mm] = m.split("-");
    const date = new Date(Date.UTC(parseInt(yyyy, 10), parseInt(mm, 10) - 1, 1));
    return date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  }

  const coverageItems = [
    { label: "Tool calling", value: capabilityCoverage.toolCalling },
    { label: "Reasoning", value: capabilityCoverage.reasoning },
    { label: "Vision input", value: capabilityCoverage.visionInput },
    { label: "Open weights", value: capabilityCoverage.openWeights },
  ];

  return (
    <div className="w-full max-w-full bg-cream-card text-cream-text rounded-[24px] sm:rounded-[28px] p-4.5 sm:p-6 lg:p-7 border border-[#d8d2c5] shadow-xl select-none overflow-hidden">
      {/* Top row: 4 Big Serif Numerals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 sm:pb-6 border-b border-[#d8d2c5]/80">
        <div>
          <div className="font-serif text-[28px] sm:text-4xl font-normal tracking-[-0.03em] text-cream-text leading-none">
            {formatNumber(totals.models)}
          </div>
          <div className="text-[10.5px] sm:text-[11px] font-mono tracking-[0.08em] uppercase text-cream-muted mt-1.5 sm:mt-2">
            Models
          </div>
        </div>

        <div>
          <div className="font-serif text-[28px] sm:text-4xl font-normal tracking-[-0.03em] text-cream-text leading-none">
            {formatNumber(totals.labs)}
          </div>
          <div className="text-[10.5px] sm:text-[11px] font-mono tracking-[0.08em] uppercase text-cream-muted mt-1.5 sm:mt-2">
            Labs
          </div>
        </div>

        <div>
          <div className="font-serif text-[28px] sm:text-4xl font-normal tracking-[-0.03em] text-cream-text leading-none">
            {formatNumber(totals.providers)}
          </div>
          <div className="text-[10.5px] sm:text-[11px] font-mono tracking-[0.08em] uppercase text-cream-muted mt-1.5 sm:mt-2">
            Providers
          </div>
        </div>

        <div>
          <div className="font-serif text-[28px] sm:text-4xl font-normal tracking-[-0.03em] text-cream-text leading-none">
            {formatNumber(totals.apiListings)}
          </div>
          <div className="text-[10.5px] sm:text-[11px] font-mono tracking-[0.08em] uppercase text-cream-muted mt-1.5 sm:mt-2">
            API Listings
          </div>
        </div>
      </div>

      {/* Bottom row: 2 Inset Cream Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
        {/* Panel A: Releases per month */}
        <div className="bg-cream-panel rounded-[18px] sm:rounded-[20px] p-3.5 sm:p-4.5 border border-[#dfd9cd] flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-medium text-cream-text">
                Releases per month
              </span>
              <span className="font-mono text-[11px] text-cream-muted">
                {formatNumber(releasesLast12Months)} in 12 mo
              </span>
            </div>

            {/* 12-bar mini chart */}
            <div
              className="h-16 flex items-end gap-1 sm:gap-1.5 pt-2"
              role="img"
              aria-label={`Monthly releases chart: ${releasesLast12Months} total models released in the last 12 months`}
            >
              {releasesPerMonth.map((item, idx) => {
                const heightPct = Math.max(
                  Math.round((item.count / maxCount) * 100),
                  8
                );
                const isPeak = item.count === maxCount;
                const isCurrent = idx === releasesPerMonth.length - 1;

                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute bottom-full mb-1 z-20 px-2 py-1 text-[10px] font-mono bg-[#1b1a17] text-[#f2eee6] rounded-md shadow-md whitespace-nowrap">
                      {item.month}: {item.count} models
                    </div>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-xs transition-all ${
                        isCurrent
                          ? "bg-[#1b1a17]"
                          : isPeak
                          ? "bg-[#544f47]"
                          : "bg-cream-bar-fill hover:bg-cream-bar-highlight"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-cream-muted mt-2 pt-1 border-t border-[#dfd9cd]/60">
            <span>{formatMonthLabel(firstMonth)}</span>
            <span>{formatMonthLabel(lastMonth)}</span>
          </div>
        </div>

        {/* Panel B: Capability coverage */}
        <div className="bg-cream-panel rounded-[20px] p-4.5 border border-[#dfd9cd] flex flex-col justify-between">
          <div className="text-xs font-medium text-cream-text mb-3">
            Capability coverage
          </div>

          <div className="flex flex-col gap-2.5">
            {coverageItems.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cream-text font-medium text-[11px]">
                    {item.label}
                  </span>
                  <span className="font-mono text-[11px] text-cream-text tabular-nums font-semibold">
                    {item.value}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#d6cfc1] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                    className="h-full bg-[#1b1a17] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
