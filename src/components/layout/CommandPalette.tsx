// src/components/layout/CommandPalette.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Sparkles,
  BarChart2,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { formatPrice, displayName } from "@/lib/formatters";
import type { SearchResultDto } from "@/types/api";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResultDto>({
    models: [],
    labs: [],
    providers: [],
  });

  // Global keyboard shortcuts (Cmd+K, Ctrl+K, and /)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (
        e.key === "/" &&
        !open &&
        !["INPUT", "TEXTAREA"].includes(
          (document.activeElement?.tagName || "").toUpperCase()
        )
      ) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const EMPTY_RESULTS: SearchResultDto = React.useMemo(
    () => ({ models: [], labs: [], providers: [] }),
    []
  );

  // Debounced search query
  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setResults(json.data);
        }
      } catch {
        // search error fallback
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const activeResults = query.trim() ? results : EMPTY_RESULTS;
  const isSearching = query.trim() ? loading : false;

  const navigate = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const hasResults =
    activeResults.models.length > 0 ||
    activeResults.labs.length > 0 ||
    activeResults.providers.length > 0;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Global Search Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150"
    >
      <div className="w-full max-w-xl bg-surface border border-border-strong rounded-[16px] shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search models, labs, providers, benchmarks..."
            className="w-full text-sm font-sans bg-transparent text-text placeholder:text-muted/60 outline-none border-none focus:outline-none focus:ring-0"
          />
          <kbd className="text-[10px] font-mono font-medium text-muted bg-surface-raised border border-border px-1.5 py-0.5 rounded-sm shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          {isSearching && (
            <div className="py-6 text-center text-xs font-mono text-muted">
              Searching OneAtlas catalog...
            </div>
          )}

          {!isSearching && query.trim() && !hasResults && (
            <Command.Empty className="py-8 text-center text-xs font-mono text-muted">
              No results found for &quot;{query}&quot;
            </Command.Empty>
          )}

          {/* Quick Actions (when query is empty) */}
          {!query.trim() && (
            <Command.Group heading="Quick Actions" className="text-[10px] font-mono tracking-[0.08em] uppercase text-muted px-2 py-1.5">
              <Command.Item
                onSelect={() => navigate("/compare?models=anthropic-claude-3.5-sonnet,openai-gpt-4o")}
                className="flex items-center justify-between px-3 py-2 text-xs text-text rounded-[8px] cursor-pointer hover:bg-surface-raised aria-selected:bg-surface-raised select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent-warn shrink-0" />
                  <span className="font-sans">Compare Top Flagship Models</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted" />
              </Command.Item>

              <Command.Item
                onSelect={() => navigate("/rankings")}
                className="flex items-center justify-between px-3 py-2 text-xs text-text rounded-[8px] cursor-pointer hover:bg-surface-raised aria-selected:bg-surface-raised select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart2 className="w-3.5 h-3.5 text-[#8fc49a] shrink-0" />
                  <span className="font-sans">View Intelligence &amp; Benchmark Rankings</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted" />
              </Command.Item>

              <Command.Item
                onSelect={() => navigate("/labs")}
                className="flex items-center justify-between px-3 py-2 text-xs text-text rounded-[8px] cursor-pointer hover:bg-surface-raised aria-selected:bg-surface-raised select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="font-sans">Browse AI Research Labs</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted" />
              </Command.Item>

              <Command.Item
                onSelect={() => navigate("/providers")}
                className="flex items-center justify-between px-3 py-2 text-xs text-text rounded-[8px] cursor-pointer hover:bg-surface-raised aria-selected:bg-surface-raised select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="font-sans">Explore Inference Providers &amp; APIs</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted" />
              </Command.Item>
            </Command.Group>
          )}

          {/* Model Results */}
          {activeResults.models.length > 0 && (
            <Command.Group heading="Models" className="text-[10px] font-mono tracking-[0.08em] uppercase text-muted px-2 py-1.5">
              {activeResults.models.map((model) => (
                <Command.Item
                  key={model.id}
                  value={`model-${model.slug}-${model.name}`}
                  onSelect={() => navigate(`/models/${model.slug}`)}
                  title={model.name}
                  className="flex items-center justify-between px-3 py-2 text-xs text-text rounded-[8px] cursor-pointer hover:bg-surface-raised aria-selected:bg-surface-raised select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LabAvatar slug={model.lab.slug} name={model.lab.name} size="sm" />
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-sans font-medium text-text truncate">
                        {displayName(model)}
                      </span>
                      <span className="font-sans text-xs text-muted truncate">
                        {model.lab.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-muted ml-3">
                    {model.blendedPrice !== null && (
                      <span className="tabular-nums">
                        {formatPrice(model.blendedPrice)}/1M
                      </span>
                    )}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Lab Results */}
          {activeResults.labs.length > 0 && (
            <Command.Group heading="Labs" className="text-[10px] font-mono tracking-[0.08em] uppercase text-muted px-2 py-1.5">
              {activeResults.labs.map((lab) => (
                <Command.Item
                  key={lab.id}
                  value={`lab-${lab.slug}-${lab.name}`}
                  onSelect={() => navigate(`/labs/${lab.slug}`)}
                  className="flex items-center justify-between px-3 py-2 text-xs text-text rounded-[8px] cursor-pointer hover:bg-surface-raised aria-selected:bg-surface-raised select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LabAvatar slug={lab.slug} name={lab.name} size="sm" />
                    <span className="font-sans font-medium truncate text-text">{lab.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-muted">
                    {lab.modelCount} {lab.modelCount === 1 ? "model" : "models"}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Provider Results */}
          {activeResults.providers.length > 0 && (
            <Command.Group heading="Providers" className="text-[10px] font-mono tracking-[0.08em] uppercase text-muted px-2 py-1.5">
              {activeResults.providers.map((p) => (
                <Command.Item
                  key={p.id}
                  value={`provider-${p.slug}-${p.name}`}
                  onSelect={() => navigate(`/providers/${p.slug}`)}
                  className="flex items-center justify-between px-3 py-2 text-xs text-text rounded-[8px] cursor-pointer hover:bg-surface-raised aria-selected:bg-surface-raised select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-surface-raised border border-border flex items-center justify-center font-mono text-[10px] text-muted">
                      {p.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-sans font-medium truncate text-text">{p.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-muted">
                    {p.hostedModelCount} models
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-border bg-surface-raised/40 flex items-center justify-between text-[11px] font-mono text-muted">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>OneAtlas</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
