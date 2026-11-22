// src/app/models/[slug]/loading.tsx
import { Skeleton } from "@/components/ui/Skeleton";

export default function ModelDetailLoading() {
  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-border">
          <div className="flex items-start gap-4">
            <Skeleton className="w-14 h-14 rounded-[14px] shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 sm:w-96" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-40 font-mono" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28 rounded-[10px]" />
            <Skeleton className="h-9 w-36 rounded-[10px]" />
          </div>
        </div>

        {/* 5 KPI Stat Tiles Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-[12px] bg-surface border border-border space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          ))}
        </div>

        {/* Overview & Spec Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-[16px] bg-surface border border-border space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="p-6 rounded-[16px] bg-surface border border-border space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        </div>

        {/* Providers Table Skeleton */}
        <div className="p-6 rounded-[16px] bg-surface border border-border space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-[8px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
