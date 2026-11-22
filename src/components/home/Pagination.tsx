// src/components/home/Pagination.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  if (total === 0 || totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const handlePageClick = (p: number) => {
    if (p === page || p < 1 || p > totalPages) return;
    onPageChange(p);
    const elem = document.getElementById("catalog-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Generate pagination window with ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (page >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Model catalog pagination"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border mt-8 select-none"
    >
      <div className="text-xs font-mono text-muted tabular-nums">
        Showing <span className="text-text font-medium">{startItem}–{endItem}</span> of{" "}
        <span className="text-text font-medium">{total}</span> models
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="h-8 px-2.5"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline ml-1">Prev</span>
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 text-center text-xs font-mono text-muted/60"
                >
                  …
                </span>
              );
            }

            const isCurrent = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePageClick(p)}
                aria-current={isCurrent ? "page" : undefined}
                className={`w-8 h-8 rounded-[8px] text-xs font-mono font-medium transition-colors cursor-pointer ${
                  isCurrent
                    ? "bg-[#e5dfd2] text-[#1b1a17] font-bold shadow-xs"
                    : "text-muted hover:text-text hover:bg-surface-raised border border-transparent hover:border-border"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="h-8 px-2.5"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </nav>
  );
}
