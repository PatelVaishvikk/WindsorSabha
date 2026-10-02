import mongoose, { Schema } from "mongoose";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import type { NextRequest } from "next/server";
import { connectDB } from "./mongodb";
const rateSchema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { versionKey: false },
);
export const LoginRateLimit =
  mongoose.models.LoginRateLimit ||
  mongoose.model("LoginRateLimit", rateSchema);
export async function consumeLoginAttempt(request: NextRequest) {
  await connectDB();
  const windowMs = 15 * 60 * 1000;
  const window = Math.floor(Date.now() / windowMs);
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    .trim();
  const address =
    process.env.TRUST_PROXY_IP === "true" && forwarded && isIP(forwarded)
      ? forwarded
      : "shared";
  const key = createHash("sha256").update(`${address}:${window}`).digest("hex");
  const limit = address === "shared" ? 60 : 10;
  // Fixed windows plus atomic increments work across all application instances.
  const entry = await LoginRateLimit.findOneAndUpdate(
    { _id: key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((window + 1) * windowMs) },
    },
    { upsert: true, new: true },
  );
  return {
    allowed: entry.count <= limit,
    retryAfter: Math.max(
      1,
      Math.ceil(((window + 1) * windowMs - Date.now()) / 1000),
    ),
  };
}
