import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MemberProfile from "@/src/components/MemberProfile";
import { getMemberName } from "@/src/data/members";
import { SPECIALIZATIONS } from "@/src/data/specializations";
import {
  getMemberProjects,
  getPublicMember,
} from "@/src/server/queries/public";

export async function generateMetadata({
  params,
}: PageProps<"/team/[id]">): Promise<Metadata> {
  const { id } = await params;
  const member = await getPublicMember(id);

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
  const member = await getPublicMember(id);

  if (!member) notFound();

  const projects = await getMemberProjects(member.id);
  return <MemberProfile member={member} projects={projects} />;
};

export default Page;
