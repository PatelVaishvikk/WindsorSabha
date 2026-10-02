import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
export const dynamic = "force-dynamic";
export function GET(
  r: NextRequest,
  { params }: { params: { collection: string; id: string } },
) {
  return handle(r, params.collection, params.id);
}
export const PUT = GET;
export const DELETE = GET;
