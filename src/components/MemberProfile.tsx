import { FC } from "react";
import Link from "next/link";
import ArrowIcon from "@/src/ui/ArrowIcon";
import ProfileCard from "@/src/components/member-sections/ProfileCard";
import ProjectPath from "@/src/components/member-sections/ProjectPath";
import { splitSkills } from "@/src/server/api/joins";
import type { MemberDetail } from "@/src/server/api/schemas";
import scss from "./MemberProfile.module.scss";

// Scenario 4 in the platform plan: a client checks someone's profile and
// projects before sending a request. The public API has no résumé
// (docs/backend-issues.md), so experience and education aren't shown.
const MemberProfile: FC<{ member: MemberDetail }> = ({ member }) => {
  const skills = splitSkills(member.skills);

  return (
    <article className={`container ${scss.profile}`}>
      <div className={scss.inner}>
        <Link href="/team" className={scss.back}>
          <ArrowIcon direction="left" />
          Все участники
        </Link>

        <div className={scss.layout}>
          <ProfileCard member={member} />

          <div className={scss.content}>
            <section className={scss.section}>
              <h2 className={scss.section__label}>О себе</h2>
              <p className={scss.bio}>
                {member.bio || "Участник пока ничего не рассказал о себе."}
              </p>
            </section>

            {skills.length > 0 && (
              <section className={scss.section}>
                <h2 className={scss.section__label}>Навыки</h2>
                <ul className={scss.skills}>
                  {skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className={scss.section}>
              <h2 className={scss.section__label}>Путь в проектах</h2>
              <ProjectPath projects={member.projects} />
            </section>
          </div>
        </div>
      </div>
    </article>
  );
};

export default MemberProfile;
