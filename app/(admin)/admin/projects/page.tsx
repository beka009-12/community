import Button from "@/src/ui/Button";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import EmptyState from "@/src/components/admin/ui/EmptyState";
import ProjectCard from "@/src/components/admin/projects/ProjectCard";
import cards from "@/src/components/admin/projects/ProjectCard.module.scss";
import { requireAdmin } from "@/src/server/auth/dal";
import { listProjectsWithMembers } from "@/src/server/repositories/projects";

const Page = async () => {
  await requireAdmin();
  const projects = await listProjectsWithMembers();
  return (
    <>
      <PageHeader
        title="Проекты"
        description={`${projects.length} в портфолио сообщества`}
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
          {projects.map(({ project, members }) => (
            <ProjectCard key={project.id} project={project} members={members} />
          ))}
        </div>
      )}
    </>
  );
};

export default Page;
