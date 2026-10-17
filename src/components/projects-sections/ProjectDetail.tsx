import { FC } from "react";
import Link from "next/link";
import Button from "@/src/ui/Button";
import ArrowIcon from "@/src/ui/ArrowIcon";
import HeroImage from "./HeroImage";
import TeamSection from "./TeamSection";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import type { TeamPerson } from "@/src/server/api/joins";
import type {
  ProjectDetail as ProjectDetailData,
  ProjectListItem,
} from "@/src/server/api/schemas";
import scss from "./ProjectDetail.module.scss";

// Server Component: only HeroImage and TeamSection carry a small client
// boundary (scroll parallax and scroll reveal).
interface ProjectDetailProps {
  project: ProjectDetailData;
  team: TeamPerson[];
  adjacent: { prev: ProjectListItem; next: ProjectListItem } | null;
}

const ProjectDetail: FC<ProjectDetailProps> = ({ project, team, adjacent }) => {
  const hasLinks = Boolean(project.demo_url || project.github_url);
  const tone = PROJECT_STATUS_TONE[project.project_status];

  return (
    <article className={scss.detail}>
      <div className={`container ${scss.detail__inner}`}>
        <Link href="/projects" className={scss.detail__back}>
          <ArrowIcon direction="left" />
          Все проекты
        </Link>

        <div className={scss.detail__header}>
          <div className={scss.detail__meta}>
            <span className={`${scss.status} ${scss[`status--${tone}`]}`}>
              {PROJECT_STATUS_LABELS[project.project_status]}
            </span>
            <span>{project.category}</span>
            <span>{project.created_at.slice(0, 4)}</span>
          </div>

          <h1 className={scss.detail__name}>
            <span className={scss.shine}>{project.name}</span>
          </h1>
          {project.description && (
            <p className={scss.detail__description}>{project.description}</p>
          )}
        </div>

        <HeroImage src={project.preview_image} name={project.name} />

        <div className={scss.detail__section}>
          <span className={scss.detail__sectionLabel}>Команда проекта</span>
          {team.length > 0 ? (
            <TeamSection people={team} />
          ) : (
            <p className={scss.detail__details}>Команда проекта ещё собирается.</p>
          )}
        </div>

        {hasLinks && (
          <div className={scss.detail__links}>
            {project.demo_url && (
              <Button href={project.demo_url} variant="primary" external>
                Открыть демо
              </Button>
            )}
            {project.github_url && (
              <Button href={project.github_url} variant="ghost" external>
                GitHub
              </Button>
            )}
          </div>
        )}
      </div>

      {adjacent && (
        <nav className={`container ${scss.pager}`} aria-label="Соседние проекты">
          <Link href={`/projects/${adjacent.prev.id}`} className={scss.pager__link}>
            <span className={scss.pager__direction}>
              <ArrowIcon direction="left" />
              Предыдущий
            </span>
            <span className={scss.pager__name}>{adjacent.prev.name}</span>
          </Link>

          <Link
            href={`/projects/${adjacent.next.id}`}
            className={`${scss.pager__link} ${scss["pager__link--next"]}`}
          >
            <span className={scss.pager__direction}>
              Следующий
              <ArrowIcon direction="right" />
            </span>
            <span className={scss.pager__name}>{adjacent.next.name}</span>
          </Link>
        </nav>
      )}
    </article>
  );
};

export default ProjectDetail;
