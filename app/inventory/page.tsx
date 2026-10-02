import { getData } from "@/lib/data";
import { InventoryList } from "@/components/inventory";
export default async function Page() {
  return <InventoryList data={await getData("inventory", false)} />;
}
