// src/components/ui/LabAvatar.tsx
// CSP-safe deterministic avatar tile for AI research labs using initials & slug hash

import { cn } from "@/lib/cn";

interface LabAvatarProps {
  slug: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Deterministic muted dark palettes
const LAB_PALETTES = [
  { bg: "bg-[#2d2825]", text: "text-[#d4af94]", border: "border-[#453c37]" },
  { bg: "bg-[#222b27]", text: "text-[#9fc5ad]", border: "border-[#34443c]" },
  { bg: "bg-[#282732]", text: "text-[#b2afdb]", border: "border-[#3d3b4e]" },
  { bg: "bg-[#2f272c]", text: "text-[#d8a8c4]", border: "border-[#4a3b45]" },
  { bg: "bg-[#2d2b23]", text: "text-[#cdc396]", border: "border-[#484436]" },
  { bg: "bg-[#212b32]", text: "text-[#9bc2d8]", border: "border-[#354551]" },
];

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getInitials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AI";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function LabAvatar({
  slug,
  name,
  size = "md",
  className,
}: LabAvatarProps) {
  const hash = hashSlug(slug || "unknown");
  const palette = LAB_PALETTES[hash % LAB_PALETTES.length];
  const initials = getInitials(name || slug || "AI");

  const sizeClasses = {
    sm: "h-6 w-6 text-[10px] rounded-md border",
    md: "h-8 w-8 text-xs rounded-[8px] border",
    lg: "h-10 w-10 text-sm rounded-[10px] border",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-mono font-medium select-none shrink-0 tracking-wider shadow-xs",
        palette.bg,
        palette.text,
        palette.border,
        sizeClasses[size],
        className
      )}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
