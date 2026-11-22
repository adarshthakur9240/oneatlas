// src/components/ui/Select.tsx
import * as React from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <select
          ref={ref}
          className={cn(
            "appearance-none h-9 pl-3 pr-8 text-xs font-medium bg-surface text-text border border-border rounded-[10px] cursor-pointer",
            "hover:border-border-strong hover:bg-surface-raised transition-colors",
            "focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="w-3.5 h-3.5 text-muted pointer-events-none absolute right-2.5"
          aria-hidden="true"
        />
      </div>
    );
  }
);
Select.displayName = "Select";
