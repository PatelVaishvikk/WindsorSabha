import { getData } from "@/lib/data";
import { SabhaForm } from "@/components/sabhas";
import { Heading } from "@/components/ui";
export default async function Page() {
  return (
    <>
      <Heading
        eyebrow="WEEKLY SABHAS"
        title="Bring the community together"
        description="Log attendance, plan mahaprasad, and keep the kitchen in sync."
      />
      <SabhaForm data={await getData("sabhas", true)} />
    </>
  );
}
