import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import ProjectForm from "@/src/components/admin/projects/ProjectForm";
import { createProjectAction } from "@/src/actions/admin/projects";
import { getProjects } from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const projects = await getProjects(true);
  return (
    <>
      <PageHeader title="Новый проект" back={{ href: "/admin/projects", label: "Проекты" }} />
      <Panel>
        <ProjectForm
          action={createProjectAction}
          submitLabel="Создать проект"
          categories={[...new Set(projects.map((project) => project.category))]}
          initial={{
            name: "",
            description: "",
            project_status: "Planned",
            category: "",
            demo_url: "",
            github_url: "",
          }}
        />
      </Panel>
    </>
  );
};

export default Page;
