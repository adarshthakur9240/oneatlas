// src/app/api/benchmarks/route.ts
import { handle, ok } from "@/lib/api-response";
import { listBenchmarks } from "@/server/services/benchmarks";


export async function GET() {
  return handle(async () => {
    const benchmarks = await listBenchmarks();
    return ok(benchmarks);
  })();
}
