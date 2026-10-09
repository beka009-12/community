import Button from "@/src/ui/Button";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import EmptyState from "@/src/components/admin/ui/EmptyState";
import ProjectCard from "@/src/components/admin/projects/ProjectCard";
import cards from "@/src/components/admin/projects/ProjectCard.module.scss";
import { plural } from "@/src/lib/plural";
import { withPeople } from "@/src/server/api/joins";
import { getMembers } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const [projects, roster] = await Promise.all([getProjectsWithMembers(true), getMembers(true)]);
  return (
    <>
      <PageHeader
        title="Проекты"
        description={`${projects.length} ${plural(projects.length, "проект", "проекта", "проектов")} в портфолио сообщества`}
        action={
          <Button href="/admin/projects/new" variant="primary">
            Создать проект
          </Button>
        }
      />
      {projects.length === 0 ? (
        <EmptyState title="Проектов пока нет" />
      ) : (
        <div className={cards.grid}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} team={withPeople(project.members, roster)} />
          ))}
        </div>
      )}
    </>
  );
};

export default Page;
