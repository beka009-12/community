import { FC } from "react";
import Link from "next/link";
import Button from "@/src/ui/Button";
import ArrowIcon from "@/src/ui/ArrowIcon";
import HeroImage from "./HeroImage";
import TeamSection from "./TeamSection";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
  getAdjacentProjects,
  type Project,
} from "@/src/data/projects";
import scss from "./ProjectDetail.module.scss";

const ORIGIN_LABELS: Record<Project["origin"], string> = {
  community: "Проект сообщества",
  client: "Проект на заказ",
};

// Server Component — the case-study write-up is static per project, no
// client interactivity needed for most of it, so it costs nothing in JS
// shipped to the browser (matches the project's Server-Components-first
// convention). Only HeroImage and TeamSection carry their own small
// client boundary, for the scroll-parallax and scroll-reveal respectively.
const ProjectDetail: FC<{ project: Project }> = ({ project }) => {
  const hasLinks = Boolean(project.demoUrl || project.githubUrl);
  const adjacent = getAdjacentProjects(project.slug);

  return (
    <article className={scss.detail}>
      <div className={`container ${scss.detail__inner}`}>
        <Link href="/projects" className={scss.detail__back}>
          <ArrowIcon direction="left" />
          Все проекты
        </Link>

        <div className={scss.detail__header}>
          <div className={scss.detail__meta}>
            <span
              className={`${scss.status} ${scss[`status--${STATUS_TONE[project.status]}`]}`}
            >
              {STATUS_LABELS[project.status]}
            </span>
            <span>{CATEGORY_LABELS[project.category]}</span>
            <span>{project.year}</span>
            <span>{ORIGIN_LABELS[project.origin]}</span>
          </div>

          <h1 className={scss.detail__name}>
            <span className={scss.shine}>{project.name}</span>
          </h1>
          <p className={scss.detail__description}>{project.description}</p>
        </div>

        <HeroImage src={project.image} alt={`${project.name} preview`} />

        <div className={scss.detail__section}>
          <span className={scss.detail__sectionLabel}>Обзор</span>
          <p className={scss.detail__details}>{project.details}</p>
        </div>

        <div className={scss.detail__section}>
          <span className={scss.detail__sectionLabel}>Технологии</span>
          <ul className={scss.detail__stack}>
            {project.stack.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </div>

        <div className={scss.detail__section}>
          <span className={scss.detail__sectionLabel}>Команда проекта</span>
          <TeamSection members={project.team} />
        </div>

        {hasLinks && (
          <div className={scss.detail__links}>
            {project.demoUrl && (
              <Button href={project.demoUrl} variant="primary" external>
                Открыть демо
              </Button>
            )}
            {project.githubUrl && (
              <Button href={project.githubUrl} variant="ghost" external>
                GitHub
              </Button>
            )}
          </div>
        )}
      </div>

      {adjacent && (
        <nav
          className={`container ${scss.pager}`}
          aria-label="Соседние проекты"
        >
          <Link
            href={`/projects/${adjacent.prev.slug}`}
            className={scss.pager__link}
          >
            <span className={scss.pager__direction}>
              <ArrowIcon direction="left" />
              Предыдущий
            </span>
            <span className={scss.pager__name}>{adjacent.prev.name}</span>
          </Link>

          <Link
            href={`/projects/${adjacent.next.slug}`}
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
