// src/components/models/ModelRelated.tsx
import { ModelCard } from "@/components/home/ModelCard";
import type { ModelSummaryDto } from "@/types/api";

interface ModelRelatedProps {
  related: ModelSummaryDto[];
}

export function ModelRelated({ related }: ModelRelatedProps) {
  if (!related || related.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="font-serif text-2xl font-normal text-text">
          Related Models
        </h3>
        <span className="text-xs font-mono text-muted">
          Alternative models with similar capabilities
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {related.map((m) => (
          <ModelCard key={m.id} model={m} />
        ))}
      </div>
    </div>
  );
}
