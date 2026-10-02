import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetail from "@/src/components/projects-sections/ProjectDetail";
import { getPublicProject } from "@/src/server/queries/public";

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicProject(slug);

  if (!data) return {};

  return {
    title: `${data.project.name} — Motion Community`,
    description: data.project.description,
  };
}

// Rendered per request: the admin can change projects at any time.
const Page = async ({ params }: PageProps<"/projects/[slug]">) => {
  const { slug } = await params;
  const data = await getPublicProject(slug);

  if (!data) notFound();

  return <ProjectDetail {...data} />;
};

export default Page;
