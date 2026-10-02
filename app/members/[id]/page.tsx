import { notFound } from "next/navigation";
import { getData } from "@/lib/data";
import { MemberProfile } from "@/components/members";
export default async function Page({ params }: { params: { id: string } }) {
  const data = await getData("members", false);
  const member = data.members.find((m) => m._id === params.id);
  if (!member) notFound();
  return <MemberProfile data={data} member={member} />;
}
