// src/app/api/stats/route.ts
import { handle, ok } from "@/lib/api-response";
import { getStats } from "@/server/services/stats";


export async function GET() {
  return handle(async () => {
    const stats = await getStats();
    return ok(stats);
  })();
}
