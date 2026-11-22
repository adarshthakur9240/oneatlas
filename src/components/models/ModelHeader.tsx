// src/components/models/ModelHeader.tsx
"use client";

import Link from "next/link";
import { LabAvatar } from "@/components/ui/LabAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { useCompare } from "@/lib/compare-store";
import { displayName, formatDate } from "@/lib/formatters";
import { Check, Plus, ExternalLink } from "lucide-react";
import type { ModelDetailDto } from "@/types/api";

interface ModelHeaderProps {
  model: ModelDetailDto;
}

export function ModelHeader({ model }: ModelHeaderProps) {
  const { has, toggle } = useCompare();
  const inCompare = has(model.slug);
  const title = displayName(model);

  return (
    <div className="w-full pb-8 border-b border-border select-none">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Left: Avatar, Title, Metadata & Badges */}
        <div className="flex items-start gap-4 sm:gap-5 min-w-0">
          <LabAvatar slug={model.lab.slug} name={model.lab.name} size="lg" />
          <div className="flex flex-col min-w-0">
            {/* Title & Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text tracking-tight">
                {title}
              </h1>
              {model.isNew && <Badge variant="new">NEW</Badge>}
              {model.isDeprecated && (
                <Badge variant="closed" className="text-accent-warn border-accent-warn/30">
                  Deprecated
                </Badge>
              )}
            </div>

            {/* Canonical sourceId with Copy */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted font-mono mb-3">
              <div className="flex items-center gap-1.5 bg-surface-raised border border-border px-2 py-0.5 rounded-[6px]">
                <span className="text-subtle">ID:</span>
                <span className="text-text font-medium select-all">{model.sourceId}</span>
                <CopyButton value={model.sourceId} iconOnly className="p-0.5 border-none bg-transparent hover:bg-border/60" />
              </div>

              {model.releaseDate && (
                <span>Released {formatDate(model.releaseDate)}</span>
              )}
            </div>

            {/* Badges strip: Lab, Model Type, Weights */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/labs/${model.lab.slug}`}
                className="hover:opacity-80 transition-opacity"
              >
                <Badge variant="default" className="text-text cursor-pointer">
                  {model.lab.name}
                </Badge>
              </Link>

              <Badge variant="outline">{model.modelType}</Badge>

              {model.isOpenWeights ? (
                <Badge variant="open">Open Weights</Badge>
              ) : (
                <Badge variant="closed">Closed Weights</Badge>
              )}

              {model.hasFreeVariant && (
                <Badge variant="new">Free Variant Available</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            type="button"
            onClick={() => toggle(model.slug)}
            variant={inCompare ? "primary-cream" : "outline"}
            size="md"
            className="gap-2 font-mono text-xs"
          >
            {inCompare ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>In Compare</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Compare</span>
              </>
            )}
          </Button>

          <a
            href={`https://openrouter.ai/${model.sourceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="md" className="gap-2 font-mono text-xs">
              <span>View on OpenRouter</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
