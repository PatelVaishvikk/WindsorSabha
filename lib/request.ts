import type { NextRequest } from "next/server";
import { AppError } from "./operations";
export function requireSameOrigin(request: NextRequest) {
  const expected = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : request.nextUrl.origin;
  if (process.env.NODE_ENV === "production" && !process.env.APP_URL)
    throw new AppError("The service is not configured.", 503);
  const origin = request.headers.get("origin");
  if (origin === expected) return;
  // Some embedded browsers omit Origin on same-origin requests. A verified
  // same-origin Referer is an alternative CSRF check, never a blanket bypass.
  if (origin === null) {
    const referer = request.headers.get("referer");
    const site = request.headers.get("sec-fetch-site");
    try {
      if (
        referer &&
        (!site || site === "same-origin") &&
        new URL(referer).origin === expected
      ) return;
    } catch {
      // Invalid URLs remain forbidden.
    }
  }
  throw new AppError(
    "Your sign-in page is out of date or opened at a different address. Reload the app and try again.",
    403,
  );
}
export async function readJson(request: NextRequest, maxBytes = 262144) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new AppError("Use application/json.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("A JSON request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new AppError("Request body is too large.", 413);
      }
      chunks.push(result.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Enter a valid JSON request body.");
  } finally {
    reader.releaseLock();
  }
}
