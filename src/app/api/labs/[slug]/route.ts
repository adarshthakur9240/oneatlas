// src/app/api/labs/[slug]/route.ts
import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { getLabBySlug } from "@/server/services/labs";


export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  return handle(async () => {
    const { slug } = await props.params;
    const lab = await getLabBySlug(slug);
    return ok(lab);
  })();
}
