import { getData } from "@/lib/data";
import { SabhaList } from "@/components/sabhas";
export default async function Page() {
  return <SabhaList data={await getData("sabhas", false)} />;
}
