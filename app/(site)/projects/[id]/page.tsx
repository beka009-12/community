import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetail from "@/src/components/projects-sections/ProjectDetail";
import { parseId } from "@/src/lib/route-id";
import { withPeople } from "@/src/server/api/joins";
import { getPublicRoster } from "@/src/server/api/members";
import { getProject, getProjects } from "@/src/server/api/projects";

const load = async (rawId: string) => {
  const id = parseId(rawId);
  return id === null ? null : getProject(id);
};

export async function generateMetadata({
  params,
}: PageProps<"/projects/[id]">): Promise<Metadata> {
  const project = await load((await params).id);
  if (!project) return {};
  return {
    title: `${project.name} — Motion Community`,
    description: project.description || undefined,
  };
}

const Page = async ({ params }: PageProps<"/projects/[id]">) => {
  const project = await load((await params).id);
  if (!project) notFound();

  const [projects, roster] = await Promise.all([getProjects(), getPublicRoster()]);
  const index = projects.findIndex((item) => item.id === project.id);
  const count = projects.length;
  // Wraps around; a single project, or one the cached list doesn't have
  // yet, gets no pager.
  const adjacent =
    index === -1 || count < 2
      ? null
      : { prev: projects[(index - 1 + count) % count], next: projects[(index + 1) % count] };

  return (
    <ProjectDetail project={project} team={withPeople(project.members, roster)} adjacent={adjacent} />
  );
};

export default Page;
