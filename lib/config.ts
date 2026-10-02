// Report names and requirements only. Never return secret values to the browser.
export function configurationIssues(
  production = process.env.NODE_ENV === "production",
): string[] {
  const issues: string[] = [];
  if (!/^mongodb(?:\+srv)?:\/\//.test(process.env.MONGODB_URI || ""))
    issues.push(
      "MONGODB_URI: configure a MongoDB Atlas connection or replica set.",
    );
  if ((process.env.SESSION_SECRET?.length || 0) < 32)
    issues.push(
      "SESSION_SECRET: set a random secret of at least 32 characters.",
    );
  if (production || process.env.APP_URL) {
    try {
      const url = new URL(process.env.APP_URL || "");
      if (
        (production && url.protocol !== "https:") ||
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      )
        throw new Error();
    } catch {
      issues.push(
        "APP_URL: set the public origin (HTTPS in production), without a path.",
      );
    }
  }
  return issues;
}
