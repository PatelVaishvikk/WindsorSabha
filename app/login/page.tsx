import { redirect } from "next/navigation";
import { configurationIssues } from "@/lib/config";
import { homeFor } from "@/lib/access";
import { getSession } from "@/lib/auth";
import Login from "@/components/login";
export default async function Page() {
  if (configurationIssues().length) redirect("/setup");
  const user = await getSession();
  if (user) redirect(homeFor(user));
  return <Login />;
}
