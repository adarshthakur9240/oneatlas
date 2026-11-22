// src/app/api/rankings/route.ts
import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { RankingsQuerySchema } from "@/lib/validators";
import { getRankings } from "@/server/services/rankings";


export async function GET(req: NextRequest) {
  return handle(async () => {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = RankingsQuerySchema.parse(rawParams);
    const rankings = await getRankings(query);
    return ok(rankings.rows, rankings.meta);
  })();
}
