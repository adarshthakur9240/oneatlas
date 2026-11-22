// src/components/ui/Chip.tsx
import * as React from "react";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, count, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={active}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer select-none shrink-0",
          "focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          active
            ? "bg-[#e5dfd2] text-[#1b1a17] border-[#e5dfd2] font-semibold"
            : "bg-surface text-muted border-border hover:border-border-strong hover:text-text",
          className
        )}
        {...props}
      >
        {active && <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />}
        <span>{children}</span>
        {count !== undefined && (
          <span
            className={cn(
              "text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full",
              active ? "bg-[#1b1a17]/15 text-[#1b1a17]" : "bg-surface-raised text-subtle"
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  }
);
Chip.displayName = "Chip";
