import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Account } from "@/models/account";
import { connectDB } from "@/lib/mongodb";
import { homeFor, publicAccount } from "@/lib/access";
import { AccessManager } from "@/components/access-manager";
export default async function Page() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "Admin") redirect(homeFor(user));
  await connectDB();
  const accounts = await Account.find().sort({ role: 1, fullName: 1 }).lean();
  return <AccessManager accounts={accounts.map(publicAccount)} />;
}
