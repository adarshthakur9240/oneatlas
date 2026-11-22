// src/components/home/ModelCard.tsx
"use client";

import Link from "next/link";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatContext, formatScore, displayName } from "@/lib/formatters";
import { useCompare } from "@/lib/compare-store";
import { Check, Plus, ArrowRight } from "lucide-react";
import type { ModelSummaryDto } from "@/types/api";

interface ModelCardProps {
  model: ModelSummaryDto;
}

export function ModelCard({ model }: ModelCardProps) {
  const { has, toggle } = useCompare();
  const inCompare = has(model.slug);

  const hasReasoning = model.capabilities.includes("reasoning");
  const hasTools = model.capabilities.includes("tool_calling");
  const hasJson = model.capabilities.includes("structured_outputs");
  const hasTemp = model.capabilities.includes("temperature");
  const hasFiles = model.capabilities.includes("files");

  // Format sourceId tail (e.g. "anthropic/claude-sonnet-4" -> "claude-sonnet-4")
  const sourceTail = model.sourceId.includes("/")
    ? model.sourceId.split("/")[1]
    : model.slug;

  const inMod = model.inputModalities.includes("image") ? "T, Image" : "T";
  const outMod = model.outputModalities.includes("embedding") ? "Embedding" : "T";

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(model.slug);
  };

  return (
    <div className="relative group bg-surface/90 hover:bg-surface border border-border hover:border-border-strong rounded-[16px] p-5 flex flex-col justify-between transition-all duration-150 shadow-xs">
      <div>
        {/* Top Row: Lab Avatar, Name & Weights Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <LabAvatar slug={model.lab.slug} name={model.lab.name} size="md" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/models/${model.slug}`}
                  title={model.name}
                  className="font-medium text-sm text-text hover:underline truncate group-hover:text-white"
                >
                  {displayName(model)}
                </Link>
                {model.isNew && <Badge variant="new">NEW</Badge>}
              </div>
              <span className="text-[11px] font-mono text-muted truncate">
                {model.lab.name} · {sourceTail}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {model.isOpenWeights ? (
              <Badge variant="open">Open weights</Badge>
            ) : (
              <span className="text-[10px] font-mono uppercase text-subtle px-2 py-0.5 border border-border rounded-full">
                Closed
              </span>
            )}
          </div>
        </div>

        {/* Modalities Line */}
        <div className="text-[11px] font-mono text-muted mb-3 flex items-center gap-1.5">
          <span className="text-subtle font-medium">IN</span>
          <span className="px-1.5 py-0.5 bg-surface-raised border border-border rounded-[4px] text-text">
            {inMod}
          </span>
          <span className="text-subtle">→</span>
          <span className="text-subtle font-medium">OUT</span>
          <span className="px-1.5 py-0.5 bg-surface-raised border border-border rounded-[4px] text-text">
            {outMod}
          </span>
        </div>

        {/* Capabilities Chip Row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5 text-[10px] font-mono">
          <span
            className={`px-2 py-0.5 rounded-[4px] border inline-flex items-center gap-1 ${
              hasReasoning
                ? "bg-[#8fc49a]/12 border-[#8fc49a]/30 text-[#8fc49a] font-medium"
                : "border-border/60 text-subtle/50 line-through"
            }`}
          >
            {hasReasoning && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            Reasoning
          </span>

          <span
            className={`px-2 py-0.5 rounded-[4px] border inline-flex items-center gap-1 ${
              hasTools
                ? "bg-[#8fc49a]/12 border-[#8fc49a]/30 text-[#8fc49a] font-medium"
                : "border-border/60 text-subtle/50 line-through"
            }`}
          >
            {hasTools && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            Tools
          </span>

          <span
            className={`px-2 py-0.5 rounded-[4px] border inline-flex items-center gap-1 ${
              hasJson
                ? "bg-[#8fc49a]/12 border-[#8fc49a]/30 text-[#8fc49a] font-medium"
                : "border-border/60 text-subtle/50 line-through"
            }`}
          >
            {hasJson && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            JSON
          </span>

          <span
            className={`px-2 py-0.5 rounded-[4px] border inline-flex items-center gap-1 ${
              hasTemp
                ? "bg-[#8fc49a]/12 border-[#8fc49a]/30 text-[#8fc49a] font-medium"
                : "border-border/60 text-subtle/50 line-through"
            }`}
          >
            {hasTemp && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            Temp
          </span>

          <span
            className={`px-2 py-0.5 rounded-[4px] border inline-flex items-center gap-1 ${
              hasFiles
                ? "bg-[#8fc49a]/12 border-[#8fc49a]/30 text-[#8fc49a] font-medium"
                : "border-border/60 text-subtle/50 line-through"
            }`}
          >
            {hasFiles && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            Files
          </span>
        </div>

        {/* Inset Spec Panel */}
        <div className="bg-surface-raised rounded-[12px] p-3 border border-border/80 mb-4 select-none">
          {/* Row 1: Context, Max Output, Input $, Output $ */}
          <div className="grid grid-cols-4 gap-2 pb-2.5 border-b border-border/50 text-center">
            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-muted">
                Context
              </div>
              <div className="font-mono text-xs font-medium text-text mt-1 tabular-nums">
                {formatContext(model.contextWindow)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-muted">
                Output
              </div>
              <div className="font-mono text-xs font-medium text-text mt-1 tabular-nums">
                {formatContext(model.maxOutputTokens)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-muted">
                In $/M
              </div>
              <div className="font-mono text-xs font-medium text-text mt-1 tabular-nums">
                {formatPrice(model.minInputPrice)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-muted">
                Out $/M
              </div>
              <div className="font-mono text-xs font-medium text-text mt-1 tabular-nums">
                {formatPrice(model.minOutputPrice)}
              </div>
            </div>
          </div>

          {/* Row 2: Intelligence, Coding, Cache Read, Lowest In */}
          <div className="grid grid-cols-4 gap-2 pt-2.5 text-center">
            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-muted">
                Intel.
              </div>
              <div className="font-mono text-xs font-medium text-text mt-1 tabular-nums">
                {formatScore(model.intelligenceScore)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-muted">
                Coding
              </div>
              <div className="font-mono text-xs font-medium text-text mt-1 tabular-nums">
                {formatScore(model.codingScore)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-muted">
                Cache
              </div>
              <div className="font-mono text-xs font-medium text-text mt-1 tabular-nums">
                {formatPrice(model.minCacheReadPrice)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-muted truncate">
                Lowest In
              </div>
              <div
                className="font-mono text-xs font-medium text-text mt-1 truncate"
                title={model.cheapestProvider?.name || "Free"}
              >
                {model.minInputPrice === 0 && model.minOutputPrice === 0
                  ? "Free"
                  : model.cheapestProvider?.name || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
        <Link
          href={`/models/${model.slug}`}
          className="inline-flex items-center gap-1 font-medium text-muted hover:text-text group/link"
        >
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>

        <button
          type="button"
          onClick={handleCompareClick}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] font-medium font-mono text-[11px] transition-colors cursor-pointer ${
            inCompare
              ? "bg-[#e5dfd2] text-[#1b1a17] font-semibold shadow-xs"
              : "bg-surface-raised hover:bg-border text-muted hover:text-text border border-border"
          }`}
        >
          {inCompare ? (
            <>
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Added</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Compare</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
