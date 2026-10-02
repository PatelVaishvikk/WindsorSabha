import { getData } from "@/lib/data";
import { MemberList } from "@/components/members";
export default async function Page({
  searchParams,
}: {
  searchParams: { mandal?: string };
}) {
  return (
    <MemberList
      data={await getData("members", false)}
      initialMandal={searchParams.mandal}
    />
  );
}
