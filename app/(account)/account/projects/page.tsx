import EmptyState from "@/src/components/admin/ui/EmptyState";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import ProjectCard from "@/src/components/admin/projects/ProjectCard";
import cards from "@/src/components/admin/projects/ProjectCard.module.scss";
import { MEMBERSHIP_ROLE_LABELS } from "@/src/lib/api-labels";
import { getMyProfile } from "@/src/server/api/account";
import { myProjects, withPeople } from "@/src/server/api/joins";
import { getMembers } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import { requireRole } from "@/src/server/auth/dal";

const Page = async () => {
  await requireRole();
  const [me, projects, roster] = await Promise.all([getMyProfile(), getProjectsWithMembers(), getMembers()]);
  const mine = myProjects(projects, me.id);

  return (
    <>
      <PageHeader title="Мои проекты" description="Проекты, в которых вы участвуете." />
      {mine.length === 0 ? (
        <EmptyState title="Вас пока не добавили ни в один проект." />
      ) : (
        <div className={cards.grid}>
          {mine.map(({ project, role }) => (
            <ProjectCard
              key={project.id}
              project={project}
              team={withPeople(project.members, roster)}
              href={`/projects/${project.id}`}
              note={`Моя роль: ${MEMBERSHIP_ROLE_LABELS[role]}`}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default Page;
