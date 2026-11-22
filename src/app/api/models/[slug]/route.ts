// src/app/api/models/[slug]/route.ts
import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { getModelBySlug } from "@/server/services/models";


export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  return handle(async () => {
    const { slug } = await props.params;
    const model = await getModelBySlug(slug);
    return ok(model);
  })();
}
