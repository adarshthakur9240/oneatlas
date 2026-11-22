// src/app/api/compare/route.ts
import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { CompareQuerySchema } from "@/lib/validators";
import { compareModels } from "@/server/services/compare";


export async function GET(req: NextRequest) {
  return handle(async () => {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = CompareQuerySchema.parse(rawParams);
    const result = await compareModels(query.slugs);
    return ok(result);
  })();
}
