// src/app/providers/error.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";

export default function ProvidersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[ProvidersError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center select-none">
      <div className="w-full max-w-md bg-surface border border-border rounded-[20px] p-8 space-y-6">
        <div className="w-12 h-12 rounded-full bg-accent-danger/15 border border-accent-danger/30 flex items-center justify-center mx-auto text-accent-danger">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-normal text-text">
            Failed to load providers
          </h2>
          <p className="text-sm text-muted">
            There was a problem retrieving inference providers and hosting endpoints.
          </p>
        </div>
        {error.digest && (
          <div className="p-2 rounded-md bg-surface-raised border border-border font-mono text-xs text-muted">
            Error digest: {error.digest}
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="primary-cream" size="md" onClick={() => reset()} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4 text-cream-text" />
            <span>Retry</span>
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="outline" size="md" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Catalog</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
