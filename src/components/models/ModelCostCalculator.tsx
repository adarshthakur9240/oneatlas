// src/components/models/ModelCostCalculator.tsx
"use client";

import * as React from "react";
import { estimateMonthlyCost } from "@/lib/cost";
import { Calculator, Sparkles, TrendingDown } from "lucide-react";
import type { ModelProviderDto } from "@/types/api";

interface ModelCostCalculatorProps {
  providers: ModelProviderDto[];
  modelName: string;
}

export function ModelCostCalculator({
  providers,
  modelName,
}: ModelCostCalculatorProps) {
  const [inputTokens, setInputTokens] = React.useState<number>(2000);
  const [outputTokens, setOutputTokens] = React.useState<number>(500);
  const [requestsPerMonth, setRequestsPerMonth] = React.useState<number>(100000);
  const [cacheHitPercent, setCacheHitPercent] = React.useState<number>(0);

  // Check if any provider has cache read pricing
  const hasCachePricing = providers.some(
    (p) => p.cacheReadPrice !== null && p.cacheReadPrice !== undefined
  );

  // Calculate costs across all providers
  const calculations = React.useMemo(() => {
    return providers
      .map((p) => {
        const cost = estimateMonthlyCost({
          inputTokensPerRequest: inputTokens,
          outputTokensPerRequest: outputTokens,
          requestsPerMonth,
          cacheHitPercent,
          inputPrice: p.inputPrice,
          outputPrice: p.outputPrice,
          cacheReadPrice: p.cacheReadPrice,
        });

        return {
          providerId: p.id,
          providerName: p.provider.name,
          endpointTag: p.endpointTag,
          cost,
        };
      })
      .sort((a, b) => a.cost.totalCost - b.cost.totalCost);
  }, [providers, inputTokens, outputTokens, requestsPerMonth, cacheHitPercent]);

  const cheapest = calculations[0];

  return (
    <div className="bg-surface border border-border rounded-[16px] p-6 space-y-6 select-none shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-accent-warn" />
          <div>
            <h2 className="font-serif text-xl font-normal text-text">
              Interactive Cost Calculator
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Estimate monthly infrastructure expense for {modelName} across endpoints
            </p>
          </div>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Input Tokens */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <label htmlFor="input-tokens-num" className="text-muted uppercase tracking-wider text-[11px] cursor-pointer">
              Input Tokens / Req
            </label>
            <input
              id="input-tokens-num"
              type="number"
              min={1}
              max={1000000}
              value={inputTokens}
              aria-label="Input tokens per request"
              onChange={(e) => setInputTokens(Math.max(1, Number(e.target.value)))}
              className="w-24 px-2 py-1 text-right text-xs font-mono font-medium bg-surface-raised border border-border rounded-md text-text outline-none focus:border-border-strong"
            />
          </div>
          <input
            type="range"
            min={100}
            max={32000}
            step={100}
            value={inputTokens}
            aria-label="Input tokens slider"
            onChange={(e) => setInputTokens(Number(e.target.value))}
            className="w-full accent-[#e5dfd2] cursor-pointer"
          />
        </div>

        {/* Output Tokens */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <label htmlFor="output-tokens-num" className="text-muted uppercase tracking-wider text-[11px] cursor-pointer">
              Output Tokens / Req
            </label>
            <input
              id="output-tokens-num"
              type="number"
              min={1}
              max={128000}
              value={outputTokens}
              aria-label="Output tokens per request"
              onChange={(e) => setOutputTokens(Math.max(1, Number(e.target.value)))}
              className="w-24 px-2 py-1 text-right text-xs font-mono font-medium bg-surface-raised border border-border rounded-md text-text outline-none focus:border-border-strong"
            />
          </div>
          <input
            type="range"
            min={50}
            max={8000}
            step={50}
            value={outputTokens}
            aria-label="Output tokens slider"
            onChange={(e) => setOutputTokens(Number(e.target.value))}
            className="w-full accent-[#e5dfd2] cursor-pointer"
          />
        </div>

        {/* Requests per Month */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <label htmlFor="requests-num" className="text-muted uppercase tracking-wider text-[11px] cursor-pointer">
              Requests / Month
            </label>
            <input
              id="requests-num"
              type="number"
              min={1000}
              max={10000000}
              step={1000}
              value={requestsPerMonth}
              aria-label="Requests per month"
              onChange={(e) =>
                setRequestsPerMonth(Math.max(1, Number(e.target.value)))
              }
              className="w-24 px-2 py-1 text-right text-xs font-mono font-medium bg-surface-raised border border-border rounded-md text-text outline-none focus:border-border-strong"
            />
          </div>
          <input
            type="range"
            min={10000}
            max={1000000}
            step={10000}
            value={requestsPerMonth}
            aria-label="Monthly requests slider"
            onChange={(e) => setRequestsPerMonth(Number(e.target.value))}
            className="w-full accent-[#e5dfd2] cursor-pointer"
          />
        </div>

        {/* Cache Hit % Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-muted uppercase tracking-wider text-[11px]">
              Cache Hit Rate
            </span>
            <span className="text-xs font-mono font-medium text-text">
              {cacheHitPercent}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            disabled={!hasCachePricing}
            value={cacheHitPercent}
            aria-label="Prompt cache hit rate percentage"
            onChange={(e) => setCacheHitPercent(Number(e.target.value))}
            className={`w-full accent-[#8fc49a] cursor-pointer ${
              !hasCachePricing ? "opacity-30 cursor-not-allowed" : ""
            }`}
          />
          {!hasCachePricing && (
            <span className="text-[10px] font-mono text-subtle block">
              No cache pricing on endpoints
            </span>
          )}
        </div>
      </div>

      {/* Results Strip */}
      {cheapest && (
        <div className="bg-surface-raised border border-border rounded-[12px] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8fc49a]/15 text-[#8fc49a] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                Cheapest Endpoint
              </span>
              <div className="text-sm font-medium text-text">
                {cheapest.providerName} · {cheapest.endpointTag}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-right">
            <div>
              <div className="text-[10px] text-muted uppercase">Blended $/1M</div>
              <div className="text-sm font-bold text-text tabular-nums">
                ${cheapest.cost.blendedPricePer1M.toFixed(3)}
              </div>
            </div>

            {cheapest.cost.cacheSavings > 0 && (
              <div className="text-[#8fc49a]">
                <div className="text-[10px] uppercase flex items-center gap-1 justify-end">
                  <TrendingDown className="w-3 h-3" />
                  <span>Cache Savings</span>
                </div>
                <div className="text-sm font-bold tabular-nums">
                  -${cheapest.cost.cacheSavings.toFixed(2)}/mo
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] text-muted uppercase">Estimated Monthly</div>
              <div className="text-xl font-bold text-text tabular-nums text-white">
                ${cheapest.cost.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranked Provider Breakdown Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted">
          Monthly Estimate by Provider (Sorted by Cost)
        </h4>
        <div className="border border-border rounded-[10px] overflow-hidden text-xs font-mono">
          <div className="grid grid-cols-12 py-2 px-3 bg-surface text-muted text-[11px] border-b border-border">
            <div className="col-span-5">Provider Endpoint</div>
            <div className="col-span-2 text-right">Input Cost</div>
            <div className="col-span-2 text-right">Output Cost</div>
            <div className="col-span-3 text-right">Total Monthly</div>
          </div>
          <div className="divide-y divide-border/60">
            {calculations.map((c, idx) => (
              <div
                key={c.providerId}
                className={`grid grid-cols-12 py-2.5 px-3 items-center ${
                  idx === 0 ? "bg-[#8fc49a]/5 font-medium" : "hover:bg-surface/50"
                }`}
              >
                <div className="col-span-5 flex items-center gap-2">
                  <span className="text-text">{c.providerName}</span>
                  <span className="text-muted text-[11px]">({c.endpointTag})</span>
                  {idx === 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-[#8fc49a]/20 text-[#8fc49a]">
                      Best
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-right text-muted tabular-nums">
                  ${c.cost.inputCost.toFixed(2)}
                </div>
                <div className="col-span-2 text-right text-muted tabular-nums">
                  ${c.cost.outputCost.toFixed(2)}
                </div>
                <div className="col-span-3 text-right text-text font-bold tabular-nums">
                  ${c.cost.totalCost.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
