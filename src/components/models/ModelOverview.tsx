// src/components/models/ModelOverview.tsx
"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { ModelDetailDto } from "@/types/api";

interface ModelOverviewProps {
  model: ModelDetailDto;
}

export function ModelOverview({ model }: ModelOverviewProps) {
  const [expanded, setExpanded] = React.useState(false);
  const description = model.description || "No official description provided for this model.";
  const isLong = description.length > 280;

  const inMods = model.inputModalities;
  const outMods = model.outputModalities;

  const allCapabilities = [
    { key: "tool_calling", label: "Function / Tool Calling" },
    { key: "reasoning", label: "Reasoning Tokens" },
    { key: "structured_outputs", label: "Structured JSON Output" },
    { key: "temperature", label: "Custom Temperature" },
    { key: "files", label: "File & Document Parsing" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Description */}
      <div className="lg:col-span-7 space-y-4">
        <h2 className="font-serif text-xl font-normal text-text">Overview</h2>
        <div className="text-sm text-muted leading-relaxed font-sans relative">
          <p className={!expanded && isLong ? "line-clamp-4" : ""}>
            {description}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs font-mono font-medium text-text hover:underline cursor-pointer select-none"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>

      {/* Right: Technical Specifications */}
      <div className="lg:col-span-5 bg-surface border border-border rounded-[16px] p-5 space-y-4 select-none">
        <h3 className="text-xs font-mono tracking-wider uppercase text-muted">
          Specifications &amp; Capabilities
        </h3>

        {/* Spec Rows */}
        <div className="space-y-2.5 text-xs font-mono border-b border-border pb-4">
          <div className="flex justify-between items-center">
            <span className="text-muted">Parameters</span>
            <span className="text-text font-medium">
              {model.parameterCount ? `${model.parameterCount}B` : "Not disclosed"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted">License</span>
            <span className="text-text font-medium truncate max-w-[200px]" title={model.license || "Proprietary"}>
              {model.license || "Proprietary"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted">Architecture Type</span>
            <span className="text-text font-medium">{model.modelType}</span>
          </div>
        </div>

        {/* Modalities Chips */}
        <div className="space-y-1.5 border-b border-border pb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
            Modalities
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="px-2 py-0.5 bg-surface-raised border border-border rounded-md text-text">
              Input: {inMods.join(", ")}
            </span>
            <span className="text-subtle">→</span>
            <span className="px-2 py-0.5 bg-surface-raised border border-border rounded-md text-text">
              Output: {outMods.join(", ")}
            </span>
          </div>
        </div>

        {/* Capabilities Matrix */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
            Features
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {allCapabilities.map((cap) => {
              const supported = model.capabilities.includes(cap.key);
              return (
                <div
                  key={cap.key}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-[6px] border ${
                    supported
                      ? "bg-[#8fc49a]/10 border-[#8fc49a]/30 text-[#8fc49a]"
                      : "bg-surface/50 border-border/60 text-subtle/50 line-through"
                  }`}
                >
                  {supported ? (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <span className="w-3.5 text-center shrink-0">—</span>
                  )}
                  <span className="truncate">{cap.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
