// src/lib/validators.ts
// Zod schemas and query parameter parsers for all API endpoints

import { z } from "zod";

/**
 * Parses comma-separated string into a deduped array of trimmed strings, capped at 20 items.
 */
export const csv = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (!val) return [];
    const raw = Array.isArray(val) ? val.join(",") : val;
    return Array.from(
      new Set(
        raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ).slice(0, 20);
  });

/**
 * Coerces truthy and falsy strings to boolean.
 */
export const boolish = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0", ""])])
  .optional()
  .transform((val) => {
    if (val === undefined || val === "") return undefined;
    if (typeof val === "boolean") return val;
    return val === "true" || val === "1";
  });

/**
 * Coerces bounded positive integer with fallback default.
 */
export const boundedInt = (min: number, max: number, defaultValue: number) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === "") return defaultValue;
      const num = typeof val === "number" ? val : parseInt(val, 10);
      if (isNaN(num)) return defaultValue;
      return Math.min(Math.max(num, min), max);
    });

export const ModelTypeSchema = z.enum([
  "FLAGSHIP",
  "REASONING",
  "CODING",
  "FAST",
  "MULTIMODAL",
  "EMBEDDING",
]);

export const ModelSortSchema = z
  .enum([
    "composite_desc",
    "intelligence_desc",
    "coding_desc",
    "price_asc",
    "price_desc",
    "context_desc",
    "context_asc",
    "release_desc",
    "release_asc",
    "name_asc",
    "providers_desc",
  ])
  .default("release_desc");

export const ModelsQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    lab: csv,
    provider: csv,
    type: csv.pipe(z.array(ModelTypeSchema)),
    capability: csv,
    inputModality: csv,
    openWeights: boolish,
    free: boolish,
    minContext: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const n = typeof val === "number" ? val : parseInt(val, 10);
        return isNaN(n) || n < 0 ? undefined : n;
      }),
    maxPrice: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const n = typeof val === "number" ? val : parseFloat(val);
        return isNaN(n) || n < 0 ? undefined : n;
      }),
    hideDeprecated: z
      .union([z.boolean(), z.enum(["true", "false", "1", "0", ""])])
      .optional()
      .transform((val) => {
        if (val === undefined || val === "") return true; // default true
        if (typeof val === "boolean") return val;
        return val === "true" || val === "1";
      }),
    sort: ModelSortSchema,
    page: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val, ctx) => {
        if (val === undefined || val === "") return 1;
        const n = typeof val === "number" ? val : parseInt(val, 10);
        if (isNaN(n) || n < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid page: must be >= 1",
          });
          return z.NEVER;
        }
        return n;
      }),
    limit: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val, ctx) => {
        if (val === undefined || val === "") return 18;
        const n = typeof val === "number" ? val : parseInt(val, 10);
        if (isNaN(n) || n < 1 || n > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid limit: must be between 1 and 100",
          });
          return z.NEVER;
        }
        return n;
      }),
  })
  .strip();

export type ModelsQuery = z.infer<typeof ModelsQuerySchema>;

export const CompareQuerySchema = z
  .object({
    slugs: z.string().transform((val, ctx) => {
      const parts = Array.from(
        new Set(
          val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      if (parts.length < 2 || parts.length > 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Compare requires between 2 and 4 unique model slugs",
        });
        return z.NEVER;
      }
      return parts;
    }),
  })
  .strip();

export type CompareQuery = z.infer<typeof CompareQuerySchema>;

export const BenchmarkMetricSchema = z.enum([
  "composite",
  "intelligence",
  "coding",
  "mmlu-pro",
  "swe-bench-verified",
  "gpqa-diamond",
  "livecodebench",
  "arena-elo",
]);

export const RankingsQuerySchema = z
  .object({
    benchmark: BenchmarkMetricSchema.default("composite"),
    type: csv.pipe(z.array(ModelTypeSchema)),
    openWeights: boolish,
    limit: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val, ctx) => {
        if (val === undefined || val === "") return 25;
        const n = typeof val === "number" ? val : parseInt(val, 10);
        if (isNaN(n) || n < 1 || n > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid limit: must be between 1 and 100",
          });
          return z.NEVER;
        }
        return n;
      }),
  })
  .strip();

export type RankingsQuery = z.infer<typeof RankingsQuerySchema>;

export const SearchQuerySchema = z
  .object({
    q: z.string().trim().default(""),
  })
  .strip();

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
