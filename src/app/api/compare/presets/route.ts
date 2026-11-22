// src/app/api/compare/presets/route.ts
import { handle, ok } from "@/lib/api-response";
import { getComparePresets } from "@/server/services/compare";


export async function GET() {
  return handle(async () => {
    const presets = await getComparePresets();
    return ok(presets);
  })();
}
