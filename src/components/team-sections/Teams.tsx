import { FC } from "react";
import Link from "next/link";
import Avatar from "@/src/ui/Avatar";
import { MEMBERSHIP_ROLE_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { ProjectTeam } from "@/src/server/api/joins";
import scss from "./Teams.module.scss";

const MAX_VISIBLE_AVATARS = 3;

// One coordinated hover moment instead of another spotlight-card grid:
// the overlapping avatar cluster spreads apart as the card lifts.
// Avatars cap at 3 with a "+N" overflow badge. Only the lead is named
// below — the Roster above already lists everyone.
const Teams: FC<{ teams: ProjectTeam[] }> = ({ teams }) => (
  <section className={scss.teams}>
    <div className={`container ${scss.teams__inner}`}>
      <h2 className={scss.teams__title}>Команды по проектам</h2>
      <p className={scss.teams__lead}>
        Те же участники, собранные по проектам, над которыми они работают.
      </p>

      <div className={scss.grid}>
        {teams.map(({ project, people }) => {
          const visible = people.slice(0, MAX_VISIBLE_AVATARS);
          const overflowCount = people.length - MAX_VISIBLE_AVATARS;
          // withPeople() sorts the lead first.
          const lead = people[0];

          return (
            <div key={project.id} className={scss.card}>
              <div className={scss.avatars}>
                {visible.map(({ member }) => (
                  <span key={member.id} className={scss.avatar}>
                    <Avatar src={member.avatar} name={fullName(member)} imageClassName={scss.avatar__img} />
                  </span>
                ))}
                {overflowCount > 0 && (
                  <span className={`${scss.avatar} ${scss["avatar--overflow"]}`}>
                    +{overflowCount}
                  </span>
                )}
              </div>

              <Link href={`/projects/${project.id}`} className={scss.card__link}>
                {project.name}
                <span className={scss.card__arrow} aria-hidden="true">
                  →
                </span>
              </Link>

              {lead && (
                <div className={scss.lead}>
                  <span className={scss.lead__role}>{fullName(lead.member)}</span>
                  <span className={scss.lead__stack}>
                    {[MEMBERSHIP_ROLE_LABELS[lead.role], positionLabel(lead.member.position)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default Teams;
