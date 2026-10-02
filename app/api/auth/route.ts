import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { configurationIssues } from "@/lib/config";
import { consumeLoginAttempt } from "@/lib/login-rate-limit";
import { requireSameOrigin, readJson } from "@/lib/request";
import { AppError } from "@/lib/operations";
import { Account } from "@/models/account";
import { connectDB } from "@/lib/mongodb";
import { normalizeUsername, verifyPassword } from "@/lib/password";
import { publicAccount, homeFor } from "@/lib/access";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: NextRequest) {
  try {
    if (configurationIssues().length)
      throw new AppError(
        "Sign-in is not configured. Contact your administrator.",
        503,
      );
    requireSameOrigin(request);
    const attempt = await consumeLoginAttempt(request);
    if (!attempt.allowed)
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please try again later." },
        {
          status: 429,
          headers: { ...headers, "Retry-After": String(attempt.retryAfter) },
        },
      );
    const body = await readJson(request, 4096);
    if (
      !body ||
      typeof body.username !== "string" ||
      !body.username.trim() ||
      body.username.length > 120 ||
      typeof body.password !== "string" ||
      body.password.length > 1024
    )
      throw new AppError("Enter your full name and password.");
    await connectDB();
    const account = await Account.findOne({
      username: normalizeUsername(body.username),
    }).select("+passwordHash");
    // Use an equally expensive hash check for unknown names to avoid trivial timing enumeration.
    const fallback = "scrypt:" + "0".repeat(32) + ":" + "0".repeat(128);
    const verified = await verifyPassword(
      body.password,
      account?.passwordHash || fallback,
    );
    if (!account || !account.isActive || !verified)
      throw new AppError("The name or password is incorrect.", 401);
    const user = publicAccount(account);
    const token = await createSession(user);
    const response = NextResponse.json(
      { user, redirectTo: homeFor(user) },
      { headers },
    );
    response.cookies.set("sabha-session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 28800,
      path: "/",
    });
    return response;
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers },
      );
    console.error(
      "Sign-in failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again." },
      { status: 503, headers },
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const response = NextResponse.json({ ok: true }, { headers });
    response.cookies.set("sabha-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: error instanceof AppError ? error.status : 403, headers },
    );
  }
}
