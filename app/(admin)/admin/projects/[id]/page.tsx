import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import ProjectForm from "@/src/components/admin/projects/ProjectForm";
import MembershipEditor from "@/src/components/admin/MembershipEditor";
import DeleteButton from "@/src/components/admin/ui/DeleteButton";
import { toCandidates, toMembershipRows } from "@/src/components/admin/membership-rows";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import {
  addProjectMemberAction,
  deleteProjectAction,
  removeProjectMemberAction,
  updateProjectAction,
} from "@/src/actions/admin/projects";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import { parseId } from "@/src/lib/route-id";
import { getMembers } from "@/src/server/api/members";
import { getProject, getProjectMembers, getProjects } from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async ({ params }: PageProps<"/admin/projects/[id]">) => {
  await requireAdmin();
  const id = parseId((await params).id);
  const project = id === null ? null : await getProject(id, true);
  if (!project) notFound();

  const [memberships, roster, projects] = await Promise.all([
    getProjectMembers(project.id),
    getMembers(true),
    getProjects(true),
  ]);

  return (
    <>
      <PageHeader
        title={project.name}
        back={{ href: "/admin/projects", label: "Проекты" }}
        description={`${project.category} · ${project.created_at.slice(0, 4)}`}
        meta={
          <StatusBadge tone={PROJECT_STATUS_TONE[project.project_status]}>
            {PROJECT_STATUS_LABELS[project.project_status]}
          </StatusBadge>
        }
        action={
          <Link href={`/projects/${project.id}`} target="_blank" className={scss.smallButton}>
            Открыть на сайте ↗
          </Link>
        }
      />
      <Panel title="Проект">
        <ProjectForm
          action={updateProjectAction.bind(null, project.id)}
          submitLabel="Сохранить"
          categories={[...new Set(projects.map((item) => item.category))]}
          initial={{
            name: project.name,
            description: project.description,
            project_status: project.project_status,
            category: project.category,
            demo_url: project.demo_url ?? "",
            github_url: project.github_url ?? "",
          }}
        />
      </Panel>
      <Panel title="Участники проекта">
        <MembershipEditor
          rows={toMembershipRows(memberships, roster)}
          candidates={toCandidates(roster, memberships)}
          addAction={addProjectMemberAction.bind(null, project.id)}
          removeAction={removeProjectMemberAction.bind(null, project.id)}
        />
      </Panel>
      <Panel title="Удаление">
        <p className={scss.field__hint}>Проект исчезнет с сайта вместе с составом команды.</p>
        <DeleteButton
          label="Удалить проект"
          confirmLabel="Да, удалить"
          action={deleteProjectAction.bind(null, project.id)}
        />
      </Panel>
    </>
  );
};

export default Page;
