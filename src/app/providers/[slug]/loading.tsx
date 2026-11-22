// src/app/providers/[slug]/loading.tsx
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProviderDetailLoading() {
  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="pb-8 border-b border-border flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-[12px] shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-[10px]" />
        </div>

        {/* Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-[12px] bg-surface border border-border space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>

        {/* Hosted Models Table */}
        <div className="p-6 rounded-[16px] bg-surface border border-border space-y-4">
          <Skeleton className="h-5 w-44" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-[8px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
