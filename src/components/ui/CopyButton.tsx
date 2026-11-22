// src/components/ui/CopyButton.tsx
"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  label?: string;
  iconOnly?: boolean;
}

export function CopyButton({
  value,
  label = "Copy",
  iconOnly = false,
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
      const textArea = document.createElement("textarea");
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : `Copy ${label}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono rounded-[6px] border border-border bg-surface text-muted hover:text-text hover:bg-surface-raised transition-colors cursor-pointer select-none",
        copied && "text-[#8fc49a] border-[#8fc49a]/30 bg-[#8fc49a]/10",
        className
      )}
      {...props}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          {!iconOnly && <span>Copied</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {!iconOnly && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
