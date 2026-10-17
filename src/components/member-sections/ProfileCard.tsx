import { FC } from "react";
import Button from "@/src/ui/Button";
import Avatar from "@/src/ui/Avatar";
import { positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { plural } from "@/src/lib/plural";
import type { MemberDetail } from "@/src/server/api/schemas";
import scss from "./ProfileCard.module.scss";

interface ProfileLink {
  href: string;
  label: string;
}

// Sticky header on desktop — keeps «Обсудить проект» in reach while the
// client reads the rest of the profile.
const ProfileCard: FC<{ member: MemberDetail }> = ({ member }) => {
  const name = fullName(member);
  const position = positionLabel(member.position);
  const projectCount = member.projects.length;

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
        <Avatar src={member.avatar} name={name} imageClassName={scss.photo__img} eager />
        <span className={scss.photo__scrim} aria-hidden="true" />
        <div className={scss.caption}>
          <h1 className={scss.name}>{name}</h1>
          {position && <p className={scss.role}>{position}</p>}
        </div>
      </div>

      <div className={scss.body}>
        {projectCount > 0 && (
          <dl className={scss.facts}>
            <div>
              <dt>{plural(projectCount, "проект", "проекта", "проектов")}</dt>
              <dd>{projectCount}</dd>
            </div>
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
