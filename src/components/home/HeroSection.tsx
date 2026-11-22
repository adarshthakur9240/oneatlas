// src/components/home/HeroSection.tsx
import Link from "next/link";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { StatsBento } from "./StatsBento";
import { ArrowRight, Sparkles } from "lucide-react";
import type { StatsDto } from "@/types/api";

interface HeroSectionProps {
  stats: StatsDto;
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="w-full pt-10 sm:pt-14 pb-12 sm:pb-16 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-muted mb-4">
              <span className="w-2 h-2 rounded-full bg-[#8fc49a] animate-pulse" />
              <span>Catalog updated {formatDate(stats.updatedAt)}</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[72px] font-normal leading-[1.04] sm:leading-[1.02] tracking-[-0.02em] text-text mb-6">
              Every AI model, compared.
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-[34rem] leading-relaxed mb-8">
              Specs, pricing, capabilities, and providers in one place. Sort any
              column, filter to what you need, and open a model for the full
              record.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Link href="/rankings">
                <Button variant="primary-cream" size="lg" className="font-semibold gap-2 shadow-xs">
                  <Sparkles className="w-4 h-4 text-cream-text" />
                  <span>See rankings</span>
                </Button>
              </Link>

              <Link href="/benchmarks">
                <Button variant="outline" size="lg">
                  Benchmarks
                </Button>
              </Link>

              <Link
                href="/labs"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-text hover:text-white px-2 py-2 group transition-colors"
              >
                <span>Browse labs</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Warm Cream Stats Bento */}
          <div className="lg:col-span-6">
            <StatsBento stats={stats} />
          </div>
        </div>
      </div>
    </section>
  );
}
