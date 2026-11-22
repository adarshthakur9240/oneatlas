// src/lib/api-response.ts
// Standard response envelopes, custom errors, and safe route handler wrapper

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/api";

export class NotFoundError extends Error {
  code = "NOT_FOUND";
  status = 404;

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  code = "BAD_REQUEST";
  status = 400;

  constructor(message: string = "Bad request", public details?: unknown) {
    super(message);
    this.name = "BadRequestError";
  }
}

export const DEFAULT_CACHE_CONTROL =
  "public, s-maxage=60, stale-while-revalidate=300";

/**
 * Return a successful standard JSON response
 */
export function ok<T>(
  data: T,
  meta?: Record<string, unknown>,
  init?: ResponseInit
): NextResponse<ApiResponse<T>> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", DEFAULT_CACHE_CONTROL);
  }
  if (!headers.has("CDN-Cache-Control") && headers.get("Cache-Control") !== "no-store") {
    headers.set("CDN-Cache-Control", DEFAULT_CACHE_CONTROL);
  }
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", crypto.randomUUID());
  }

  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };

  return NextResponse.json(body, {
    ...init,
    status: init?.status ?? 200,
    headers,
  });
}

/**
 * Return a failed standard JSON response
 */
export function fail(
  code: string,
  message: string,
  status: number,
  details?: unknown,
  init?: ResponseInit
): NextResponse<ApiResponse<never>> {
  const headers = new Headers(init?.headers);
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", crypto.randomUUID());
  }
  // Errors must not be cached publicly
  headers.set("Cache-Control", "no-store");

  const body: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json(body, {
    ...init,
    status,
    headers,
  });
}

/**
 * Wraps an async route handler with comprehensive error handling and requestId tracing.
 */
export function handle<T>(
  fn: () => Promise<NextResponse<ApiResponse<T>>>
): () => Promise<NextResponse<ApiResponse<unknown>>> {
  return async () => {
    const requestId = crypto.randomUUID();
    try {
      const res = await fn();
      if (!res.headers.has("x-request-id")) {
        res.headers.set("x-request-id", requestId);
      }
      return res as NextResponse<ApiResponse<unknown>>;
    } catch (err: unknown) {
      // Re-throw Next.js internal control-flow exceptions (prerender bailout, redirects, etc.)
      if (
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof (err as { digest?: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_")
      ) {
        throw err;
      }

      if (err instanceof ZodError) {
        const flattened = err.flatten();
        return fail(
          "VALIDATION_ERROR",
          "Invalid request parameters",
          400,
          {
            fieldErrors: flattened.fieldErrors,
            formErrors: flattened.formErrors,
          },
          { headers: { "x-request-id": requestId } }
        );
      }

      if (err instanceof NotFoundError) {
        return fail("NOT_FOUND", err.message, 404, undefined, {
          headers: { "x-request-id": requestId },
        });
      }

      if (err instanceof BadRequestError) {
        return fail("BAD_REQUEST", err.message, 400, err.details, {
          headers: { "x-request-id": requestId },
        });
      }

      // Log server-side with requestId, never leak internal details/SQL to client
      console.error(`[API Error][${requestId}]`, err);

      return fail(
        "INTERNAL_ERROR",
        "An unexpected error occurred. Please try again later.",
        500,
        undefined,
        { headers: { "x-request-id": requestId } }
      );
    }
  };
}
