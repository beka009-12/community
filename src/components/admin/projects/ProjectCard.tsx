import { FC } from "react";
import Link from "next/link";
import AvatarStack from "@/src/components/admin/AvatarStack";
import StatusBadge, { type BadgeTone } from "@/src/components/admin/ui/StatusBadge";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_TONE } from "@/src/data/projects";
import type { DbProject } from "@/src/server/db/types";
import type { MemberWithRole } from "@/src/server/repositories/teams";
import scss from "./ProjectCard.module.scss";

const ProjectCard: FC<{ project: DbProject; members: MemberWithRole[] }> = ({ project, members }) => {
  const lead = members.find((member) => member.membershipRole === "TEAM_LEAD");
  return (
    <Link href={`/admin/projects/${project.id}`} className={scss.card}>
      <span className={scss.card__media}>
        {/* External placeholder previews on various hosts — plain <img>,
            same as the public project grid. */}
        <img src={project.image} alt="" loading="lazy" className={scss.card__image} />
        <span className={scss.card__status}>
          <StatusBadge tone={STATUS_TONE[project.status] as BadgeTone}>
            {STATUS_LABELS[project.status]}
          </StatusBadge>
        </span>
      </span>
      <span className={scss.card__body}>
        <span className={scss.card__meta}>
          {CATEGORY_LABELS[project.category]} · {project.year}
          {project.featured && " · на главной"}
        </span>
        <span className={scss.card__name}>{project.name}</span>
        <span className={scss.card__footer}>
          <AvatarStack
            people={members.map((member) => ({
              id: member.user.id,
              name: `${member.profile.firstName} ${member.profile.lastName}`,
              photo: member.profile.photo,
            }))}
          />
          <span className={`${scss.card__lead} ${lead ? "" : scss["card__lead--missing"]}`}>
            {lead ? `Тимлид: ${lead.profile.firstName} ${lead.profile.lastName}` : "Нет тимлида"}
          </span>
        </span>
      </span>
    </Link>
  );
};

export default ProjectCard;
