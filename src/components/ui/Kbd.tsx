// src/components/ui/Kbd.tsx
import { cn } from "@/lib/cn";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center h-5 px-1.5 text-[11px] font-mono font-medium text-muted bg-surface-raised border border-border rounded-[5px] select-none shadow-2xs",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
