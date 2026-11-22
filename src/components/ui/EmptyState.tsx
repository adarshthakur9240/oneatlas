// src/components/ui/EmptyState.tsx
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { FilterX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onClear?: () => void;
  className?: string;
}

export function EmptyState({
  title = "No models match your filters",
  description = "Try adjusting your search query, clearing specific capability tags, or toggling 'Hide deprecated'.",
  onClear,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-[16px] bg-surface/40 my-8",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center text-muted mb-3.5">
        <FilterX className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-medium text-text mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-4">{description}</p>
      {onClear && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
