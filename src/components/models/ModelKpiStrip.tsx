// src/components/models/ModelKpiStrip.tsx
import { StatTile } from "@/components/ui/StatTile";
import { formatPrice, formatContext } from "@/lib/formatters";
import type { ModelDetailDto } from "@/types/api";

interface ModelKpiStripProps {
  model: ModelDetailDto;
}

export function ModelKpiStrip({ model }: ModelKpiStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 select-none">
      <StatTile
        label="Lowest Input"
        value={formatPrice(model.minInputPrice)}
        subtext="/ 1M tokens"
      />
      <StatTile
        label="Lowest Output"
        value={formatPrice(model.minOutputPrice)}
        subtext="/ 1M tokens"
      />
      <StatTile
        label="Context Window"
        value={formatContext(model.contextWindow)}
        subtext={model.contextWindow ? `${model.contextWindow.toLocaleString()} tokens` : "—"}
      />
      <StatTile
        label="Max Output"
        value={formatContext(model.maxOutputTokens)}
        subtext={model.maxOutputTokens ? `${model.maxOutputTokens.toLocaleString()} tokens` : "—"}
      />
      <StatTile
        label="Cache Read"
        value={formatPrice(model.minCacheReadPrice)}
        subtext="/ 1M cached tokens"
      />
    </div>
  );
}
