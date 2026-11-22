// src/components/ui/Input.tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-muted pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full h-9 bg-surface text-text text-sm border border-border rounded-[10px] transition-colors placeholder:text-muted/60",
            icon ? "pl-9 pr-3" : "px-3",
            "hover:border-border-strong focus:border-border-strong",
            "focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
