import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
export const dynamic = "force-dynamic";
export function GET(
  r: NextRequest,
  { params }: { params: { collection: string } },
) {
  return handle(r, params.collection);
}
export function POST(
  r: NextRequest,
  { params }: { params: { collection: string } },
) {
  return handle(r, params.collection);
}
