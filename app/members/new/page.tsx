import { getData } from "@/lib/data";
import { MemberForm } from "@/components/members";
import { Heading } from "@/components/ui";
export default async function Page() {
  return (
    <>
      <Heading
        eyebrow="YOUTH DIRECTORY"
        title="Welcome a new member"
        description="Every connection begins with getting to know someone."
      />
      <MemberForm data={await getData("members", true)} />
    </>
  );
}
