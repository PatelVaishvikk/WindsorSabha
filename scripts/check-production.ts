import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
loadEnvConfig(process.cwd(), false);
async function main() {
  const { configurationIssues } = await import("../lib/config");
  const issues = configurationIssues(true);
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
    return;
  }
  const { connectDB } = await import("../lib/mongodb");
  const client = await connectDB();
  const hello = await client.connection.db!.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid")
    throw new Error(
      "MongoDB must be a replica set or Atlas cluster for stock transactions.",
    );
  console.log(
    "Production configuration and MongoDB transaction topology verified.",
  );
}
main()
  .catch((error) => {
    console.error("Production check failed:", error.name);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
