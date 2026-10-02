import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { readJson, requireSameOrigin } from "@/lib/request";
import { updateAccountAccess } from "@/lib/account-access";
import { AppError } from "@/lib/operations";
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireUser(true);
    requireSameOrigin(request);
    return NextResponse.json(
      await updateAccountAccess(params.id, await readJson(request)),
    );
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    if (error instanceof ZodError)
      return NextResponse.json(
        { error: "Choose valid permissions and account status." },
        { status: 422 },
      );
    return NextResponse.json(
      { error: "Unable to update access. Please try again." },
      { status: 500 },
    );
  }
}
