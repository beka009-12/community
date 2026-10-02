import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MemberProfile from "@/src/components/MemberProfile";
import {
  PUBLIC_MEMBERS,
  getMemberName,
  getPublicMember,
} from "@/src/data/members";
import { SPECIALIZATIONS } from "@/src/data/specializations";

export async function generateStaticParams() {
  return PUBLIC_MEMBERS.map((member) => ({ id: member.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/team/[id]">): Promise<Metadata> {
  const { id } = await params;
  const member = getPublicMember(id);

  if (!member) return {};

  const position = SPECIALIZATIONS.find(
    (spec) => spec.id === member.specializationId,
  )?.title;

  return {
    title: `${getMemberName(member)} — Motion Community`,
    description: [position, member.bio].filter(Boolean).join(". "),
  };
}

const Page = async ({ params }: PageProps<"/team/[id]">) => {
  const { id } = await params;
  const member = getPublicMember(id);

  if (!member) notFound();

  return <MemberProfile member={member} />;
};

export default Page;
