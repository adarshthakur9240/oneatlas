// src/app/global-error.tsx
"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col items-center justify-center bg-[#161614] text-[#f2eee6] p-4 select-none font-sans">
        <div className="max-w-md w-full bg-[#1c1c1a] border border-[#2e2d2a] rounded-[20px] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-[#d9705f]/15 border border-[#d9705f]/30 flex items-center justify-center mx-auto text-[#d9705f]">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-normal text-[#f2eee6]">
              System Encountered an Error
            </h1>
            <p className="text-sm text-[#9b968b] leading-relaxed">
              An unexpected application error occurred. We have logged the trace and will restore state.
            </p>
          </div>

          {error.digest && (
            <div className="p-2.5 rounded-[8px] bg-[#222220] border border-[#2e2d2a] font-mono text-xs text-[#9b968b] select-all">
              Digest: <span className="text-[#f2eee6]">{error.digest}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#e5dfd2] text-[#1b1a17] text-sm font-semibold hover:bg-[#dcd6c8] active:bg-[#d0c9b9] transition-colors cursor-pointer w-full"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
