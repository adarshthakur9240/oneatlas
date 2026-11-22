// src/lib/prisma.ts
// Singleton PrismaClient with Neon serverless connection resilience:
// - Retries ONLY transient connection errors (P1001, P1002, P1008, P1017, P2024, initialization & closed errors)
// - Exponential backoff (150ms, 400ms, 900ms) with jitter
// - Event emitter logging to silence idle-closed pooler noise (<1 log / 30s) while preserving real error logs
// - Fully typed for services and Server Components

import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Predicate to identify transient database connection errors that are safe to retry.
 * Never retries validation errors (P2002, P2025, etc.), application logic, or syntax errors.
 */
export function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") {
    return false;
  }

  // 1. PrismaClientKnownRequestError: specific connection-related codes
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const transientCodes = ["P1001", "P1002", "P1008", "P1017", "P2024"];
    return transientCodes.includes(err.code);
  }

  // 2. PrismaClientInitializationError: connection failure during client startup/connect
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  // 3. PrismaClientUnknownRequestError: network drops or connection resets
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const msg = err.message || "";
    return (
      msg.includes("Closed") ||
      msg.toLowerCase().includes("closed") ||
      msg.includes("terminating connection") ||
      msg.includes("ECONNRESET")
    );
  }

  // 4. PrismaClientValidationError or Rust Panic: not transient connection issues
  if (
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    return false;
  }

  // 5. Fallback duck-typing for wrapped or cross-boundary error objects
  const e = err as { code?: unknown; name?: unknown; message?: unknown };
  if (
    typeof e.code === "string" &&
    ["P1001", "P1002", "P1008", "P1017", "P2024", "ECONNRESET"].includes(e.code)
  ) {
    return true;
  }
  if (e.name === "PrismaClientInitializationError") {
    return true;
  }
  if (typeof e.message === "string") {
    const msg = e.message;
    if (
      msg.includes("Closed") ||
      msg.toLowerCase().includes("closed") ||
      msg.includes("terminating connection") ||
      msg.includes("ECONNRESET")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts a concise error code identifier for log messages without stack traces.
 */
function getErrorCode(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { code?: unknown; name?: unknown; message?: unknown };
    if (typeof e.code === "string") return e.code;
    if (typeof e.name === "string" && e.name !== "Error") return e.name;
    if (typeof e.message === "string") {
      if (e.message.includes("Closed")) return "CLOSED";
      if (e.message.includes("terminating connection")) return "TERMINATING";
      if (e.message.includes("ECONNRESET")) return "ECONNRESET";
    }
  }
  return "TRANSIENT";
}

const RETRY_DELAYS_MS = [150, 400, 900];

/**
 * Executes a database operation with exponential backoff for transient connection errors.
 * Maximum 3 retry attempts (delays: ~150ms, ~400ms, ~900ms + jitter).
 */
export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (err) {
      if (!isTransientDbError(err) || attempt >= RETRY_DELAYS_MS.length) {
        throw err;
      }

      attempt++;
      const code = getErrorCode(err);
      console.warn(`[db] transient connection error, retry ${attempt}/3`, code);

      const baseDelay = RETRY_DELAYS_MS[attempt - 1];
      const jitter = Math.floor(Math.random() * (baseDelay * 0.2));
      await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
    }
  }
}

// Log deduplication state for Neon idle-closed connections
let lastClosedLogTimestamp = 0;
const CLOSED_DEDUPE_WINDOW_MS = 30_000;

export function handlePrismaLogEvent(level: "error" | "warn", e: Prisma.LogEvent) {
  const msg = e.message || "";
  const isClosed =
    msg.includes("kind: Closed") ||
    msg.includes("Error { kind: Closed") ||
    msg.includes("connection closed") ||
    msg.includes("Closed, cause: None");

  if (isClosed) {
    const now = Date.now();
    if (now - lastClosedLogTimestamp >= CLOSED_DEDUPE_WINDOW_MS) {
      lastClosedLogTimestamp = now;
      console.warn("[db] connection closed by pooler (idle), will reconnect");
    }
    return;
  }

  // Real, different errors must still print in full
  if (level === "error") {
    console.error(`[db:error] ${msg}`);
  } else {
    console.warn(`[db:warn] ${msg}`);
  }
}

function createExtendedPrismaClient() {
  const basePrisma = new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  basePrisma.$on("error", (e) => handlePrismaLogEvent("error", e));
  basePrisma.$on("warn", (e) => handlePrismaLogEvent("warn", e));

  return basePrisma.$extends({
    query: {
      $allOperations({ query, args }) {
        return withRetry(() => query(args));
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createExtendedPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
