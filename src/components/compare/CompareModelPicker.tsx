// src/components/compare/CompareModelPicker.tsx
"use client";

import * as React from "react";
import { Search, X, Plus } from "lucide-react";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { displayName, formatPrice } from "@/lib/formatters";
import type { SearchResultDto } from "@/types/api";

interface CompareModelPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (slug: string) => void;
  currentSlugs: string[];
}

export function CompareModelPicker({
  open,
  onClose,
  onSelect,
  currentSlugs,
}: CompareModelPickerProps) {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResultDto["models"]>([]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    onClose();
  };

  React.useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed || "claude")}`);
        const json = await res.json();
        if (json.success && json.data) {
          setResults(json.data.models || []);
        }
      } catch {
        // Search error fallback
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [open, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in-0 duration-150">
      <div className="w-full max-w-lg bg-surface border border-border-strong rounded-[16px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header with Search Input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search model to add to comparison..."
            className="w-full text-sm font-sans bg-transparent text-text placeholder:text-muted/60 outline-none"
          />
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-muted hover:text-text rounded-md cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[320px] overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-muted">
              Searching OneAtlas models...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted">
              No matching models found.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((m) => {
                const alreadySelected = currentSlugs.includes(m.slug);
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={alreadySelected}
                    onClick={() => {
                      onSelect(m.slug);
                      handleClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-[8px] transition-colors cursor-pointer select-none text-left ${
                      alreadySelected
                        ? "opacity-40 cursor-not-allowed bg-surface/30"
                        : "hover:bg-surface-raised text-text"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LabAvatar slug={m.lab.slug} name={m.lab.name} size="sm" />
                      <div className="truncate">
                        <span className="font-medium text-text">{displayName(m)}</span>
                        <span className="text-[11px] font-mono text-muted ml-2">
                          {m.lab.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-muted">
                      {m.blendedPrice !== null && (
                        <span>{formatPrice(m.blendedPrice)}/1M</span>
                      )}
                      {alreadySelected ? (
                        <span className="text-[10px] text-subtle">Added</span>
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-muted hover:text-text" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
