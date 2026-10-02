import { FC } from "react";
import Link from "next/link";
import ArrowIcon from "@/src/ui/ArrowIcon";
import ProfileCard from "@/src/components/member-sections/ProfileCard";
import ProjectPath from "@/src/components/member-sections/ProjectPath";
import ResumeTimeline from "@/src/components/member-sections/ResumeTimeline";
import type { Member } from "@/src/data/members";
import { getMemberProjects } from "@/src/data/teams";
import scss from "./MemberProfile.module.scss";

// Scenario 4 in the platform plan: a client checks someone's résumé and
// portfolio before sending a request. Only ProjectPath is a client
// component (its one scroll-in moment).
const MemberProfile: FC<{ member: Member }> = ({ member }) => {
  const projects = getMemberProjects(member);
  const experience = member.experience.map((item) => ({
    title: item.company,
    subtitle: item.role,
    period: item.period,
    description: item.description,
  }));
  const education = member.education.map((item) => ({
    title: item.institution,
    subtitle: item.program,
    period: item.period,
  }));

  return (
    <article className={`container ${scss.profile}`}>
      <div className={scss.inner}>
        <Link href="/team" className={scss.back}>
          <ArrowIcon direction="left" />
          Все участники
        </Link>

        <div className={scss.layout}>
          <ProfileCard member={member} projects={projects} />

          <div className={scss.content}>
            <section className={scss.section}>
              <h2 className={scss.section__label}>О себе</h2>
              <p className={scss.bio}>{member.bio}</p>
            </section>

            <section className={scss.section}>
              <h2 className={scss.section__label}>Навыки</h2>
              <ul className={scss.skills}>
                {member.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </section>

            {experience.length > 0 && (
              <section className={scss.section}>
                <h2 className={scss.section__label}>Опыт</h2>
                <ResumeTimeline entries={experience} />
              </section>
            )}

            <section className={scss.section}>
              <h2 className={scss.section__label}>Путь в проектах</h2>
              <ProjectPath items={projects} />
            </section>

            {education.length > 0 && (
              <section className={scss.section}>
                <h2 className={scss.section__label}>Образование</h2>
                <ResumeTimeline entries={education} />
              </section>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default MemberProfile;
