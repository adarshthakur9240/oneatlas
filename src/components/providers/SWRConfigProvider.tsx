// src/components/providers/SWRConfigProvider.tsx
"use client";

import * as React from "react";
import { SWRConfig } from "swr";

const defaultFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData?.error?.message || `HTTP ${res.status}: Failed to fetch`);
    (error as unknown as { status: number }).status = res.status;
    throw error;
  }
  return res.json();
};

export function SWRConfigProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: defaultFetcher,
        revalidateOnFocus: false,
        revalidateIfStale: true,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        errorRetryInterval: 1500,
        dedupingInterval: 4000,
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          // Never retry 404s or 400s
          if (error.status === 404 || error.status === 400) return;
          // Maximum 3 retries
          if (retryCount >= 3) return;
          // Exponential backoff: 1.5s, 3s, 6s
          const timeout = Math.min(1500 * Math.pow(2, retryCount), 10000);
          setTimeout(() => revalidate({ retryCount }), timeout);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
