// src/components/ui/SectionHeader.tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export interface SectionHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  count?: number;
  actions?: React.ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  count,
  actions,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 mb-6 border-b border-border select-none",
        className
      )}
      {...props}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text tracking-tight">
            {title}
          </h2>
          {count !== undefined && (
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-surface-raised border border-border text-muted tabular-nums">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl font-sans">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
