import { Dashboard } from "@/components/dashboard";
import { getData } from "@/lib/data";
export default async function Page() {
  return <Dashboard data={await getData("dashboard", false)} />;
}
