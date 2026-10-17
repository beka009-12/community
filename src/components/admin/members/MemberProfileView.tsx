import { FC, ReactNode } from "react";
import Link from "next/link";
import Avatar from "@/src/ui/Avatar";
import { PROJECT_STATUS_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { splitSkills } from "@/src/server/api/joins";
import type { AdminMemberDetail, ProjectListItem } from "@/src/server/api/schemas";
import scss from "./MemberProfileView.module.scss";

interface MemberProfileViewProps {
  member: AdminMemberDetail;
  projects: ProjectListItem[];
}

// Read-only: the member owns these data. The admin sees what clients see,
// plus the login.
const MemberProfileView: FC<MemberProfileViewProps> = ({ member, projects }) => {
  const name = fullName(member, member.login);
  const position = positionLabel(member.position);
  const skills = splitSkills(member.skills);
  const links = [
    { label: "GitHub", href: member.github },
    { label: "LinkedIn", href: member.linkedin },
    { label: "Портфолио", href: member.portfolio },
    { label: "Резюме (PDF)", href: member.resume },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: "О себе", value: member.bio || <span className={scss.empty}>Не заполнено</span> },
    {
      label: "Навыки",
      value: skills.length ? (
        <ul className={scss.chips}>
          {skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      ) : (
        <span className={scss.empty}>Не указаны</span>
      ),
    },
    {
      label: "Ссылки",
      value: links.length ? (
        <span className={scss.links}>
          {links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label} ↗
            </a>
          ))}
        </span>
      ) : (
        <span className={scss.empty}>Нет</span>
      ),
    },
    {
      label: "Проекты",
      value: projects.length ? (
        <ul className={scss.list}>
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/admin/projects/${project.id}`}>{project.name}</Link>{" "}
              <span>{PROJECT_STATUS_LABELS[project.project_status]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className={scss.empty}>Пока ни в одном проекте</span>
      ),
    },
  ];

  return (
    <section className={scss.view} aria-label="Профиль участника">
      <div className={scss.head}>
        <span className={scss.photo}>
          <Avatar src={member.avatar} name={name} imageClassName={scss.photo__img} />
        </span>
        <div>
          <p className={scss.name}>{name}</p>
          {position && <p className={scss.position}>{position}</p>}
          <p className={scss.login}>{member.login}</p>
        </div>
      </div>

      <dl className={scss.rows}>
        {rows.map((row) => (
          <div key={row.label} className={scss.row}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default MemberProfileView;
