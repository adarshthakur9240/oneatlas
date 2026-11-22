// src/components/ui/StatTile.tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: React.ReactNode;
}

export function StatTile({
  label,
  value,
  subtext,
  icon,
  className,
  ...props
}: StatTileProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-[14px] p-4 flex flex-col justify-between select-none shadow-xs",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.08em] uppercase text-muted mb-2">
        <span>{label}</span>
        {icon && <span className="text-subtle">{icon}</span>}
      </div>
      <div className="font-mono text-xl sm:text-2xl font-medium text-text tabular-nums">
        {value}
      </div>
      {subtext && (
        <div className="mt-1 text-[11px] text-muted truncate">{subtext}</div>
      )}
    </div>
  );
}
