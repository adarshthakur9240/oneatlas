// src/app/compare/loading.tsx
import { Skeleton } from "@/components/ui/Skeleton";

export default function CompareLoading() {
  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Title & Presets */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-28 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {/* 3 Model Columns Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[16px] bg-surface border border-border space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-[10px] shrink-0" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>

        {/* Matrix Rows */}
        <div className="rounded-[16px] bg-surface border border-border p-6 space-y-6">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-[8px]" />
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-[16px]" />
          <Skeleton className="h-80 w-full rounded-[16px]" />
        </div>
      </div>
    </div>
  );
}
