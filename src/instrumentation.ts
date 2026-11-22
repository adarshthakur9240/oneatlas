// src/instrumentation.ts
// Next.js instrumentation hook for server boot warmup
// Runs SELECT 1 on Node.js runtime boot so the first user request does not pay cold-start latency

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { prisma } = await import("@/lib/prisma");
      const start = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      const elapsed = Math.round(performance.now() - start);
      console.log(`[db] Warmup connection established (${elapsed}ms)`);
    } catch (err) {
      // Never crash server startup if warmup fails (e.g. during build, offline, or migration)
      console.warn(
        "[db] Warmup connection attempt skipped or failed:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }
}
