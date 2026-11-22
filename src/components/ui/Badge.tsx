// src/components/ui/Badge.tsx
import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "new" | "open" | "closed" | "outline" | "cream";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const isPill = variant === "open" || variant === "closed";
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-mono tracking-wider uppercase font-semibold border select-none shrink-0",
        isPill ? "rounded-full px-2 py-0.5" : "rounded-md px-1.5 py-0.5",
        variant === "default" &&
          "bg-surface-raised text-muted border-border",
        variant === "new" &&
          "bg-[#8fc49a]/15 text-[#8fc49a] border-[#8fc49a]/30",
        variant === "open" &&
          "bg-[#8fc49a]/15 text-[#8fc49a] border-[#8fc49a]/30 font-medium",
        variant === "closed" &&
          "bg-surface text-subtle border-border font-medium",
        variant === "outline" &&
          "bg-transparent text-muted border-border",
        variant === "cream" &&
          "bg-[#eee9df] text-[#1b1a17] border-[#d5cfc2]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
