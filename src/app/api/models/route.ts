// src/app/api/models/route.ts
import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { ModelsQuerySchema } from "@/lib/validators";
import { listModels } from "@/server/services/models";


export async function GET(req: NextRequest) {
  return handle(async () => {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = ModelsQuerySchema.parse(rawParams);
    const result = await listModels(query);
    return ok(result.models, result.meta);
  })();
}
