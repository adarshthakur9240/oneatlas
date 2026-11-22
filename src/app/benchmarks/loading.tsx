// src/app/benchmarks/loading.tsx
import { Skeleton } from "@/components/ui/Skeleton";

export default function BenchmarksLoading() {
  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Header */}
        <div className="pb-6 border-b border-border space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Benchmark Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-[16px] p-5 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20 rounded-sm" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-12 w-full" />
              <div className="space-y-2 pt-2 border-t border-border/60">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-full rounded-sm" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Methodology Skeleton */}
        <div className="p-8 rounded-[20px] bg-surface border border-border space-y-6">
          <Skeleton className="h-6 w-56" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-[14px]" />
            <Skeleton className="h-32 w-full rounded-[14px]" />
            <Skeleton className="h-32 w-full rounded-[14px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
