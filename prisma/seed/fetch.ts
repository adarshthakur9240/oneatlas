// prisma/seed/fetch.ts
// Fetch layer: on-disk cache, exponential backoff, concurrency limit

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const CACHE_DIR = path.join(process.cwd(), ".cache", "openrouter");

export function ensureCacheDir(): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function cacheKey(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex").slice(0, 32);
}

function cacheFile(url: string): string {
  return path.join(CACHE_DIR, `${cacheKey(url)}.json`);
}

export async function fetchWithCache(
  url: string,
  options: { refresh?: boolean; apiKey?: string } = {}
): Promise<unknown> {
  const file = cacheFile(url);

  if (!options.refresh && fs.existsSync(file)) {
    const cached = fs.readFileSync(file, "utf-8");
    return JSON.parse(cached) as unknown;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer": "https://oneatlas.dev",
    "X-Title": "OneAtlas",
  };
  if (options.apiKey) {
    headers["Authorization"] = `Bearer ${options.apiKey}`;
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) {
      // exponential backoff + jitter
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 500, 30000);
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);

      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status} from ${url}`);
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${url}`);
      }
      const data: unknown = await res.json();
      fs.writeFileSync(file, JSON.stringify(data), "utf-8");
      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.name === "AbortError") {
        lastError = new Error(`Timeout fetching ${url}`);
      }
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

// Promise pool: concurrency-limited parallel execution
export async function promisePool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let idx = 0;
  async function worker(): Promise<void> {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i]!, i);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    worker
  );
  await Promise.all(workers);
}
