import { notFound } from "next/navigation";
import { getData } from "@/lib/data";
import { SabhaDetail } from "@/components/sabhas";
export default async function Page({ params }: { params: { id: string } }) {
  const data = await getData("sabhas", false);
  const sabha = data.sabhas.find((s) => s._id === params.id);
  if (!sabha) notFound();
  return <SabhaDetail data={data} sabha={sabha} />;
}
