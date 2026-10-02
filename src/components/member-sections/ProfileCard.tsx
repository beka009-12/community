import { FC } from "react";
import Image from "next/image";
import Button from "@/src/ui/Button";
import { getMemberName, type Member } from "@/src/data/members";
import { SPECIALIZATIONS } from "@/src/data/specializations";
import type { MemberProject } from "@/src/data/teams";
import scss from "./ProfileCard.module.scss";

interface ProfileLink {
  href: string;
  label: string;
}

interface ProfileCardProps {
  member: Member;
  projects: MemberProject[];
}

const pluralizeProjects = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "проект";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "проекта";
  return "проектов";
};

// Sticky résumé header on desktop — keeps "Обсудить проект" in reach
// while the client reads the rest of the profile.
const ProfileCard: FC<ProfileCardProps> = ({ member, projects }) => {
  const name = getMemberName(member);
  const position = SPECIALIZATIONS.find(
    (spec) => spec.id === member.specializationId,
  )?.title;
  const leadCount = projects.filter((item) => item.role === "TEAM_LEAD").length;

  // Only links the member actually filled in — no dead buttons.
  const links = [
    member.github && { href: member.github, label: "GitHub" },
    member.linkedin && { href: member.linkedin, label: "LinkedIn" },
    member.portfolio && { href: member.portfolio, label: "Портфолио" },
    member.resume && { href: member.resume, label: "Резюме (PDF)" },
  ].filter((link): link is ProfileLink => Boolean(link));

  return (
    <aside className={scss.card}>
      {/* Same portrait + bottom scrim + caption language as the Roster
          cells on /team, at profile scale. */}
      <div className={scss.photo}>
        <Image
          src={member.photo}
          alt={name}
          fill
          priority
          sizes="(min-width: 960px) 320px, (min-width: 640px) 280px, 100vw"
          className={scss.photo__img}
        />
        <span className={scss.photo__scrim} aria-hidden="true" />
        <div className={scss.caption}>
          <h1 className={scss.name}>{name}</h1>
          <p className={scss.role}>{member.role}</p>
          {position && <p className={scss.position}>{position}</p>}
        </div>
      </div>

      <div className={scss.body}>
        {projects.length > 0 && (
          <dl className={scss.facts}>
            <div>
              <dt>{pluralizeProjects(projects.length)}</dt>
              <dd>{projects.length}</dd>
            </div>
            {leadCount > 0 && (
              <div>
                <dt>из них тимлидом</dt>
                <dd>{leadCount}</dd>
              </div>
            )}
          </dl>
        )}

        {links.length > 0 && (
          <ul className={scss.links}>
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <Button href="/contact" variant="primary" className={scss.cta}>
          Обсудить проект
        </Button>
      </div>
    </aside>
  );
};

export default ProfileCard;
