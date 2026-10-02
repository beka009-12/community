import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import ProjectForm from "@/src/components/admin/projects/ProjectForm";
import { createProjectAction } from "@/src/actions/admin/projects";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Новый проект" back={{ href: "/admin/projects", label: "Проекты" }} />
      <Panel>
        <ProjectForm
          action={createProjectAction}
          isNew
          submitLabel="Создать проект"
          initial={{
            id: "",
            name: "",
            description: "",
            details: "",
            status: "PLANNED",
            category: "systems",
            origin: "client",
            year: String(new Date().getFullYear()),
            image: "",
            stack: "",
            demoUrl: "",
            githubUrl: "",
            featured: false,
          }}
        />
      </Panel>
    </>
  );
};

export default Page;
