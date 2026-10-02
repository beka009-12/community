import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import ProjectForm from "@/src/components/admin/projects/ProjectForm";
import MembershipEditor from "@/src/components/admin/MembershipEditor";
import {
  toCandidates,
  toMembershipRows,
} from "@/src/components/admin/membership-rows";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import {
  removeProjectMemberAction,
  updateProjectAction,
  upsertProjectMemberAction,
} from "@/src/actions/admin/projects";
import { requireAdmin } from "@/src/server/auth/dal";
import { listMembers } from "@/src/server/repositories/members";
import { getProject } from "@/src/server/repositories/projects";

const Page = async ({ params }: PageProps<"/admin/projects/[id]">) => {
  await requireAdmin();
  const { id } = await params;
  const [data, allMembers] = await Promise.all([getProject(id), listMembers()]);
  if (!data) notFound();
  const { project } = data;

  return (
    <>
      <PageHeader
        title={project.name}
        back={{ href: "/admin/projects", label: "Проекты" }}
        action={
          <Link
            href={`/projects/${id}`}
            target="_blank"
            className={scss.smallButton}
          >
            Открыть на сайте ↗
          </Link>
        }
      />
      <Panel title="Проект">
        <ProjectForm
          action={updateProjectAction.bind(null, id)}
          submitLabel="Сохранить"
          initial={{
            ...project,
            stack: project.stack.join(", "),
            demoUrl: project.demoUrl ?? "",
            githubUrl: project.githubUrl ?? "",
          }}
        />
      </Panel>
      <Panel title="Участники проекта">
        <MembershipEditor
          rows={toMembershipRows(data.members)}
          candidates={toCandidates(allMembers, data.members)}
          upsertAction={upsertProjectMemberAction.bind(null, id)}
          removeAction={removeProjectMemberAction.bind(null, id)}
        />
      </Panel>
    </>
  );
};

export default Page;
