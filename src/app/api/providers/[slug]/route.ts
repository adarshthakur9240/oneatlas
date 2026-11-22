// src/app/api/providers/[slug]/route.ts
import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { getProviderBySlug } from "@/server/services/providers";


export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  return handle(async () => {
    const { slug } = await props.params;
    const provider = await getProviderBySlug(slug);
    return ok(provider);
  })();
}
