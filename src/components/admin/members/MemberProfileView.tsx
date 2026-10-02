import { FC, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DbProfile } from "@/src/server/db/types";
import type { MemberWithRole } from "@/src/server/repositories/teams";
import { SPECIALIZATIONS } from "@/src/data/specializations";
import { MEMBERSHIP_LABELS } from "../labels";
import scss from "./MemberProfileView.module.scss";

interface MemberProfileViewProps {
  login: string;
  profile: DbProfile;
  projects: Array<{ id: string; name: string; role: MemberWithRole["membershipRole"] }>;
}

// Read-only: the member owns these data (ТЗ — Developer edits their own
// profile). The admin sees exactly what clients see, plus the login.
const MemberProfileView: FC<MemberProfileViewProps> = ({ login, profile, projects }) => {
  const position = SPECIALIZATIONS.find((spec) => spec.id === profile.specializationId)?.title;
  const links = [
    { label: "GitHub", href: profile.github },
    { label: "LinkedIn", href: profile.linkedin },
    { label: "Портфолио", href: profile.portfolio },
    { label: "Резюме (PDF)", href: profile.resume },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: "О себе", value: profile.bio || <span className={scss.empty}>Не заполнено</span> },
    {
      label: "Навыки",
      value: profile.skills.length ? (
        <ul className={scss.chips}>
          {profile.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      ) : (
        <span className={scss.empty}>Не указаны</span>
      ),
    },
    { label: "Стек", value: profile.stack || <span className={scss.empty}>Не указан</span> },
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
      label: "Опыт",
      value: profile.experience.length ? (
        <ul className={scss.list}>
          {profile.experience.map((item) => (
            <li key={`${item.company}-${item.period}`}>
              <b>{item.company}</b> · {item.role} <span>{item.period}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className={scss.empty}>Нет записей</span>
      ),
    },
    {
      label: "Образование",
      value: profile.education.length ? (
        <ul className={scss.list}>
          {profile.education.map((item) => (
            <li key={`${item.institution}-${item.period}`}>
              <b>{item.institution}</b> · {item.program} <span>{item.period}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className={scss.empty}>Нет записей</span>
      ),
    },
    {
      label: "Проекты",
      value: projects.length ? (
        <ul className={scss.list}>
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/admin/projects/${project.id}`}>{project.name}</Link>{" "}
              <span>{MEMBERSHIP_LABELS[project.role]}</span>
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
          <Image src={profile.photo} alt="" fill sizes="88px" className={scss.photo__img} />
        </span>
        <div>
          <p className={scss.name}>
            {profile.firstName} {profile.lastName}
          </p>
          <p className={scss.position}>
            {profile.roleTitle}
            {position && ` · ${position}`}
          </p>
          <p className={scss.login}>{login}</p>
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
