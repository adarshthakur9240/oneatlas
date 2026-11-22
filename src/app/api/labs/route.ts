// src/app/api/labs/route.ts
import { handle, ok } from "@/lib/api-response";
import { listLabs } from "@/server/services/labs";


export async function GET() {
  return handle(async () => {
    const labs = await listLabs();
    return ok(labs);
  })();
}
