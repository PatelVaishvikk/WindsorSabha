import { NextResponse } from "next/server";
import { configurationIssues } from "@/lib/config";
import { connectDB } from "@/lib/mongodb";
export const dynamic = "force-dynamic";
export async function GET() {
  let ready = false;
  try {
    if (!configurationIssues().length) {
      const client = await connectDB();
      const hello = await client.connection.db!.admin().command({ hello: 1 });
      ready = !!(hello.setName || hello.msg === "isdbgrid");
    }
  } catch {
    /* Public health checks must not disclose configuration details. */
  }
  return NextResponse.json(
    { status: ready ? "ready" : "unavailable" },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
