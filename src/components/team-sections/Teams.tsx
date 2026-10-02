import { FC } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProjectTeam } from "@/src/server/queries/public";
import scss from "./Teams.module.scss";

const MAX_VISIBLE_AVATARS = 3;

// One coordinated hover moment instead of another spotlight-card grid:
// the overlapping avatar cluster spreads apart as the card lifts.
// Avatars cap at 3 with a "+N" overflow badge for larger teams later.
// Only the team lead's role/stack is shown below — the cluster itself
// already communicates "this many people," a full roster duplicates
// the Roster section above.
const Teams: FC<{ teams: ProjectTeam[] }> = ({ teams }) => (
  <section className={scss.teams}>
    <div className={`container ${scss.teams__inner}`}>
      <h2 className={scss.teams__title}>Команды по проектам</h2>
      <p className={scss.teams__lead}>
        Те же участники, собранные по проектам, над которыми они работают.
      </p>

      <div className={scss.grid}>
        {teams.map((team) => {
          const { members } = team;
          const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);
          const overflowCount = members.length - MAX_VISIBLE_AVATARS;
          const lead = members.find((member) => member.role.startsWith("Тимлид")) ?? members[0];

          return (
            <div key={team.id} className={scss.card}>
              <div className={scss.avatars}>
                {visibleMembers.map((member) => (
                  <span key={member.id} className={scss.avatar}>
                    <Image
                      src={member.photo}
                      alt=""
                      fill
                      sizes="44px"
                      className={scss.avatar__img}
                    />
                  </span>
                ))}
                {overflowCount > 0 && (
                  <span className={`${scss.avatar} ${scss["avatar--overflow"]}`}>
                    +{overflowCount}
                  </span>
                )}
              </div>

              <Link href={`/projects/${team.projectSlug}`} className={scss.card__link}>
                {team.projectName}
                <span className={scss.card__arrow} aria-hidden="true">
                  →
                </span>
              </Link>

              {lead && (
                <div className={scss.lead}>
                  <span className={scss.lead__role}>{lead.role}</span>
                  <span className={scss.lead__stack}>{lead.stack}</span>
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
