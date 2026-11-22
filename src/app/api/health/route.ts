// src/app/api/health/route.ts
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";
import type { HealthDto } from "@/types/api";


export async function GET() {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);

    const data: HealthDto = {
      status: "ok",
      db: "up",
      latencyMs,
      time: new Date().toISOString(),
    };

    return ok(data, undefined, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[Health Check Failed]", err);
    return fail(
      "SERVICE_UNAVAILABLE",
      "Database connection failed",
      503,
      {
        status: "error",
        db: "down",
        latencyMs: -1,
        time: new Date().toISOString(),
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
