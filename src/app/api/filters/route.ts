// src/app/api/filters/route.ts
import { handle, ok } from "@/lib/api-response";
import { getFilterFacets } from "@/server/services/filters";


export async function GET() {
  return handle(async () => {
    const facets = await getFilterFacets();
    return ok(facets);
  })();
}
