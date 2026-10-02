import { notFound } from "next/navigation";
import { getData } from "@/lib/data";
import { InventoryDetail } from "@/components/inventory";
export default async function Page({ params }: { params: { id: string } }) {
  const data = await getData("inventory", false);
  const item = data.inventory.find((i) => i._id === params.id);
  if (!item) notFound();
  return <InventoryDetail data={data} item={item} />;
}
