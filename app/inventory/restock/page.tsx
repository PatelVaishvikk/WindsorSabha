import { getData } from "@/lib/data";
import { StockForm } from "@/components/inventory";
import { Heading } from "@/components/ui";
export default async function Page({
  searchParams,
}: {
  searchParams: { item?: string };
}) {
  return (
    <>
      <Heading
        eyebrow="GROCERY & INVENTORY"
        title="Restock the kitchen"
        description="Make sure the essentials are ready for your next gathering."
      />
      <StockForm
        data={await getData("inventory", true)}
        initialItem={searchParams.item}
      />
    </>
  );
}
