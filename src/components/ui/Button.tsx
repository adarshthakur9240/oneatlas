// src/components/ui/Button.tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary-cream" | "outline" | "ghost" | "link" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "outline", size = "md", type = "button", ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors select-none",
          "focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
          // Variants
          variant === "primary-cream" &&
            "bg-[#e5dfd2] text-[#1b1a17] hover:bg-[#dcd6c8] active:bg-[#d0c9b9] border border-transparent font-medium",
          variant === "outline" &&
            "border border-border bg-surface hover:bg-surface-raised hover:border-border-strong text-text",
          variant === "ghost" &&
            "text-muted hover:text-text hover:bg-surface-raised",
          variant === "link" &&
            "text-text hover:underline underline-offset-4 p-0 h-auto",
          variant === "danger" &&
            "border border-accent-danger/30 text-accent-danger hover:bg-accent-danger/10",
          // Sizes
          size === "sm" && "h-8 px-3 text-xs rounded-[8px] gap-1.5",
          size === "md" && "h-9 px-4 text-sm rounded-[10px] gap-2",
          size === "lg" && "h-11 px-6 text-base rounded-[10px] gap-2.5",
          size === "icon" && "h-8 w-8 rounded-[8px] p-0 flex items-center justify-center",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
