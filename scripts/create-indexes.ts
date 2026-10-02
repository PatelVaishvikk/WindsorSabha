import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
loadEnvConfig(process.cwd(), false);
async function main() {
  const { connectDB } = await import("../lib/mongodb");
  const { models } = await import("../models");
  const { LoginRateLimit } = await import("../lib/login-rate-limit");
  const { Account } = await import("../models/account");
  await connectDB();
  // Creates declared indexes only; never seeds, drops, or synchronizes away existing indexes.
  for (const model of [...Object.values(models), LoginRateLimit, Account])
    await model.createIndexes();
  console.log(
    "Application and login rate-limit indexes created. No records were seeded.",
  );
}
main()
  .catch((error) => {
    console.error("Index creation failed:", error.name);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
