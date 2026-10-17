import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MemberProfile from "@/src/components/MemberProfile";
import { positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { parseId } from "@/src/lib/route-id";
import { getMember } from "@/src/server/api/members";

// Inactive members stay off the public site.
const load = async (rawId: string) => {
  const id = parseId(rawId);
  const member = id === null ? null : await getMember(id);
  return member?.status === "Active" ? member : null;
};

export async function generateMetadata({
  params,
}: PageProps<"/team/[id]">): Promise<Metadata> {
  const member = await load((await params).id);
  if (!member) return {};
  return {
    title: `${fullName(member)} — Motion Community`,
    description: [positionLabel(member.position), member.bio].filter(Boolean).join(". "),
  };
}

const Page = async ({ params }: PageProps<"/team/[id]">) => {
  const member = await load((await params).id);
  if (!member) notFound();
  return <MemberProfile member={member} />;
};

export default Page;
