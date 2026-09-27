import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetail from "@/src/components/projects-sections/ProjectDetail";
import { PROJECTS, getProjectBySlug } from "@/src/data/projects";

export async function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) return {};

  return {
    title: `${project.name} — Motion Community`,
    description: project.description,
  };
}

const Page = async ({ params }: PageProps<"/projects/[slug]">) => {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  return <ProjectDetail project={project} />;
};

export default Page;
