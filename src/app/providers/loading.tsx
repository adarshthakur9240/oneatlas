// src/app/providers/loading.tsx
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProvidersLoading() {
  return (
    <div className="w-full min-h-screen py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-border space-y-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Skeleton className="h-10 w-full sm:w-80 rounded-[10px]" />
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Skeleton className="h-9 w-32 rounded-[10px]" />
            <Skeleton className="h-9 w-20 rounded-[10px]" />
          </div>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[16px] bg-surface border border-border space-y-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-[10px] shrink-0" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
