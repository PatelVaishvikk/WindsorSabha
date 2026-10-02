import Link from "next/link";
import { redirect } from "next/navigation";
import { configurationIssues } from "@/lib/config";
export default function Setup() {
  const issues = configurationIssues();
  if (!issues.length) redirect("/login");
  return (
    <div className="login-screen">
      <section className="login-card" style={{ maxWidth: 560 }}>
        <div className="eyebrow">HSAPSS CANADA</div>
        <h1>Workspace setup required</h1>
        <p className="subtitle">
          Your workspace will start empty. An administrator needs to connect the
          database and configure secure access before members can sign in.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <div className="notice">
            <p className="font-semibold mb-2">
              Configure the server environment:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
            <p className="mt-3">
              Use .env.example and the README, then restart the server.
            </p>
          </div>
        )}
        <Link className="button primary" href="/dashboard">
          Check setup again
        </Link>
      </section>
    </div>
  );
}
