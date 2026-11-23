// src/lib/url.ts
/**
 * Resolves the application base URL for metadata, OpenGraph, sitemap, and robots.
 * Precedence:
 * 1. NEXT_PUBLIC_APP_URL
 * 2. https://${VERCEL_PROJECT_PRODUCTION_URL}
 * 3. http://localhost:3000
 *
 * Never hardcodes oneatlas.dev.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
