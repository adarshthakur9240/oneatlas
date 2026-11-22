// src/app/loading.tsx
import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Hero Stats Card Skeleton */}
        <div className="w-full rounded-[28px] bg-cream-card/90 border border-border/40 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <Skeleton className="h-4 w-32 bg-cream-muted/20" />
              <Skeleton className="h-10 w-80 bg-cream-muted/30" />
              <Skeleton className="h-4 w-96 bg-cream-muted/20" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-14 w-24 rounded-[12px] bg-cream-muted/20" />
              <Skeleton className="h-14 w-24 rounded-[12px] bg-cream-muted/20" />
              <Skeleton className="h-14 w-24 rounded-[12px] bg-cream-muted/20" />
            </div>
          </div>
          {/* Release Trend Bar Chart Skeleton */}
          <div className="pt-4 border-t border-cream-muted/20 flex items-end gap-2 h-24">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t-sm bg-cream-muted/25"
                style={{ height: `${20 + ((i * 7) % 60)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Toolbar & Filter Skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <Skeleton className="h-10 w-full sm:w-80 rounded-[10px]" />
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Skeleton className="h-9 w-28 rounded-[10px]" />
              <Skeleton className="h-9 w-20 rounded-[10px]" />
            </div>
          </div>
          {/* Quick Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {/* Model Cards / Rows Skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-18 rounded-[12px] border border-border/60 bg-surface/60 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <Skeleton className="w-9 h-9 rounded-[10px] shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Skeleton className="h-4 w-20 hidden md:block" />
                <Skeleton className="h-4 w-24 hidden sm:block" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8 rounded-[8px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
