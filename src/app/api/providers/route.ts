// src/app/api/providers/route.ts
import { handle, ok } from "@/lib/api-response";
import { listProviders } from "@/server/services/providers";


export async function GET() {
  return handle(async () => {
    const providers = await listProviders();
    return ok(providers);
  })();
}
