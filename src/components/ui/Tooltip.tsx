// src/components/ui/Tooltip.tsx
// Lightweight accessible tooltip using pure CSS positioning & peer classes

import { cn } from "@/lib/cn";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom";
}

export function Tooltip({
  content,
  children,
  className,
  side = "top",
}: TooltipProps) {
  return (
    <div className={cn("relative group inline-flex items-center", className)}>
      {children}
      <div
        role="tooltip"
        className={cn(
          "absolute pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 z-50",
          "px-2 py-1 text-[11px] font-mono font-medium text-text bg-surface-raised border border-border-strong rounded-md shadow-md whitespace-nowrap",
          side === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
          side === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-1.5"
        )}
      >
        {content}
      </div>
    </div>
  );
}
