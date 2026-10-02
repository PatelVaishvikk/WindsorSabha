import { getData } from "@/lib/data";
import { InventoryForm } from "@/components/inventory";
import { Heading } from "@/components/ui";
export default async function Page() {
  return (
    <>
      <Heading
        eyebrow="GROCERY & INVENTORY"
        title="Add a kitchen essential"
        description="Create an item and set the stock level to keep on hand."
      />
      <InventoryForm data={await getData("inventory", true)} />
    </>
  );
}
