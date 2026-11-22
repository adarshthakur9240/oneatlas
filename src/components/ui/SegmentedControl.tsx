// src/components/ui/SegmentedControl.tsx
import { cn } from "@/lib/cn";
import { LayoutGrid, Table as TableIcon } from "lucide-react";

export type ViewMode = "table" | "cards";

interface SegmentedControlProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
}

export function SegmentedControl({
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label="View toggle"
      className={cn(
        "inline-flex items-center p-0.5 bg-surface border border-border rounded-[10px] shrink-0",
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "table"}
        onClick={() => onChange("table")}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[8px] transition-colors cursor-pointer select-none",
          value === "table"
            ? "bg-surface-raised text-text border border-border-strong shadow-xs font-semibold"
            : "text-muted hover:text-text hover:bg-surface-raised/40 border border-transparent"
        )}
      >
        <TableIcon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Table</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === "cards"}
        onClick={() => onChange("cards")}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[8px] transition-colors cursor-pointer select-none",
          value === "cards"
            ? "bg-surface-raised text-text border border-border-strong shadow-xs font-semibold"
            : "text-muted hover:text-text hover:bg-surface-raised/40 border border-transparent"
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Cards</span>
      </button>
    </div>
  );
}
