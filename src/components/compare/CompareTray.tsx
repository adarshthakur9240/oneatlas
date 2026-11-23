// src/components/compare/CompareTray.tsx
"use client";

import Link from "next/link";
import { useCompare } from "@/lib/compare-store";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CompareTray() {
  const { slugs, remove, clear } = useCompare();

  if (slugs.length === 0) return null;

  const compareUrl = `/compare?models=${slugs.join(",")}`;
  const canCompare = slugs.length >= 2;

  return (
    <aside
      aria-label="Model comparison tray"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-raised/95 backdrop-blur-md border border-border-strong rounded-[16px] shadow-2xl">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto max-w-[calc(100%-140px)] py-0.5">
          <span className="text-xs font-mono font-medium text-muted shrink-0 pl-1">
            Compare ({slugs.length}/4):
          </span>
          {slugs.map((slug) => (
            <span
              key={slug}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-text bg-surface border border-border rounded-[8px] shrink-0"
            >
              <span className="truncate max-w-[140px]">{slug}</span>
              <button
                type="button"
                onClick={() => remove(slug)}
                className="text-muted hover:text-text cursor-pointer"
                aria-label={`Remove ${slug} from comparison`}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-xs text-muted hover:text-text"
          >
            Clear
          </Button>

          {canCompare ? (
            <Link href={compareUrl}>
              <Button variant="primary-cream" size="sm" className="gap-1.5 font-semibold">
                <span>Compare</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary-cream"
              size="sm"
              disabled
              title="Select at least 2 models to compare"
              className="gap-1.5 opacity-50 cursor-not-allowed"
            >
              <span>Add 1 more</span>
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
