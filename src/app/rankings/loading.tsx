// src/app/rankings/loading.tsx
import { Skeleton } from "@/components/ui/Skeleton";

export default function RankingsLoading() {
  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="pb-6 border-b border-border space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Benchmark Tabs & Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-36 rounded-[10px] shrink-0" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-[16px]" />
          <Skeleton className="h-80 w-full rounded-[16px]" />
        </div>

        {/* Leaderboard Table Skeleton */}
        <div className="rounded-[16px] bg-surface border border-border p-6 space-y-4">
          <Skeleton className="h-5 w-44" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-[8px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
