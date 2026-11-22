// src/app/api/search/route.ts
import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { SearchQuerySchema } from "@/lib/validators";
import { searchAll } from "@/server/services/search";


export async function GET(req: NextRequest) {
  return handle(async () => {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = SearchQuerySchema.parse(rawParams);
    const results = await searchAll(query.q);
    return ok(results);
  })();
}
