// src/app/error.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  React.useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center select-none">
      <div className="w-full max-w-md flex flex-col items-center bg-surface border border-border rounded-[24px] p-8 space-y-6 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-accent-danger/15 border border-accent-danger/30 flex items-center justify-center text-accent-danger">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-normal text-text">
            Something went wrong
          </h1>
          <p className="text-sm text-muted leading-relaxed font-sans">
            We were unable to render this view. You can retry the request or return to the main catalog.
          </p>
        </div>

        {error.digest && (
          <div className="w-full p-2.5 rounded-[8px] bg-surface-raised border border-border font-mono text-xs text-muted text-center select-all">
            Reference ID: <span className="text-text font-medium">{error.digest}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <Button
            variant="primary-cream"
            size="md"
            onClick={() => reset()}
            className="w-full sm:flex-1 gap-2 font-semibold shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-cream-text" />
            <span>Try again</span>
          </Button>
          <Link href="/" className="w-full sm:flex-1">
            <Button variant="outline" size="md" className="w-full gap-2">
              <Home className="w-4 h-4" />
              <span>Catalog</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
