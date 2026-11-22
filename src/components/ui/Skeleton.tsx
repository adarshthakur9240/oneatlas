// src/components/ui/Skeleton.tsx
import { cn } from "@/lib/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-raised/80",
        className
      )}
      {...props}
    />
  );
}
