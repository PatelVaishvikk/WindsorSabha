import { getData } from "@/lib/data";
import { DishTemplates } from "@/components/dishes";
export default async function Page() {
  return <DishTemplates data={await getData("sabhas", false)} />;
}
