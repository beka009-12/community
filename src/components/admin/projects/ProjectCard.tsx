import { FC } from "react";
import Link from "next/link";
import AvatarStack from "@/src/components/admin/AvatarStack";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import ProjectCover from "@/src/ui/ProjectCover";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { TeamPerson } from "@/src/server/api/joins";
import type { ProjectDetail } from "@/src/server/api/schemas";
import scss from "./ProjectCard.module.scss";

const ProjectCard: FC<{ project: ProjectDetail; team: TeamPerson[] }> = ({ project, team }) => {
  const lead = team.find((person) => person.role === "Team_Lead");
  return (
    <Link href={`/admin/projects/${project.id}`} className={scss.card}>
      <span className={scss.card__media}>
        <ProjectCover src={project.preview_image} name={project.name} imageClassName={scss.card__image} />
        <span className={scss.card__status}>
          <StatusBadge tone={PROJECT_STATUS_TONE[project.project_status]}>
            {PROJECT_STATUS_LABELS[project.project_status]}
          </StatusBadge>
        </span>
      </span>
      <span className={scss.card__body}>
        <span className={scss.card__meta}>{project.category}</span>
        <span className={scss.card__name}>{project.name}</span>
        <span className={scss.card__footer}>
          <AvatarStack
            people={team.map(({ member }) => ({ name: fullName(member), avatar: member.avatar }))}
          />
          <span className={`${scss.card__lead} ${lead ? "" : scss["card__lead--missing"]}`}>
            {lead ? `Тимлид: ${fullName(lead.member)}` : "Нет тимлида"}
          </span>
        </span>
      </span>
    </Link>
  );
};

export default ProjectCard;
