"use client";

import { FC, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import Avatar from "@/src/ui/Avatar";
import Button from "@/src/ui/Button";
import ProjectPath from "@/src/ui/ProjectPath";
import { useSafeMotion } from "@/src/hooks/use-safe-motion";
import { springs } from "@/src/lib/motion-tokens";
import { MEMBERSHIP_ROLE_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { plural } from "@/src/lib/plural";
import type { LeadProfile } from "@/src/server/api/joins";
import scss from "./Leads.module.scss";

// Names work as a menu: the chosen lead's portrait, bio and projects show
// beside the list, which stays short however many leads there are.
const Leads: FC<{ leads: LeadProfile[] }> = ({ leads }) => {
  const [activeId, setActiveId] = useState(leads[0].member.id);
  const active = leads.find((lead) => lead.member.id === activeId) ?? leads[0];
  const safeMotion = useSafeMotion(8);

  const name = fullName(active.member);
  const position = positionLabel(active.member.position);

  return (
    <section className={scss.leads}>
      <div className="container">
        <h2 className={scss.leads__title}>Тимлиды, которые проверяют каждый этап</h2>
        <p className={scss.leads__lead}>
          Они принимают архитектурные решения, ведут команды и ревьюят код
          каждого участника.
        </p>

        <div className={scss.leads__grid}>
          <div className={scss.names} role="group" aria-label="Выбор тимлида">
            {leads.map((lead) => {
              const isActive = lead.member.id === active.member.id;
              const count = lead.projects.length;
              return (
                <button
                  key={lead.member.id}
                  type="button"
                  className={scss.name}
                  aria-pressed={isActive}
                  aria-controls="lead-detail"
                  onClick={() => setActiveId(lead.member.id)}
                >
                  {isActive && (
                    <motion.span
                      layoutId="lead-marker"
                      className={scss.name__marker}
                      transition={springs.snappy}
                    />
                  )}
                  <span className={scss.name__text}>{fullName(lead.member)}</span>
                  <span className={scss.name__count}>
                    {count} {plural(count, "проект", "проекта", "проектов")}
                  </span>
                </button>
              );
            })}
          </div>

          <div id="lead-detail" className={scss.detail}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.member.id}
                className={scss.detail__inner}
                initial={safeMotion.initial}
                animate={safeMotion.animate}
                exit={safeMotion.exit}
                transition={springs.snappy}
              >
                <div className={scss.portrait}>
                  <Avatar src={active.member.avatar} name={name} />
                </div>

                <div className={scss.info}>
                  <p className={scss.info__position}>
                    {position ? `Тимлид, ${position}` : "Тимлид"}
                  </p>
                  <h3 className={scss.info__name}>{name}</h3>
                  {active.bio && <p className={scss.info__bio}>{active.bio}</p>}

                  {active.projects.length > 0 && (
                    <ul className={scss.projects}>
                      {active.projects.map((project) => (
                        <li key={project.id}>
                          <Link href={`/projects/${project.id}`} className={scss.project}>
                            <span className={scss.project__name}>{project.name}</span>
                            <span className={scss.project__role}>
                              {MEMBERSHIP_ROLE_LABELS[project.role]}
                            </span>
                            <ProjectPath status={project.status} className={scss.project__path} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button href={`/team/${active.member.id}`} variant="ghost" className={scss.info__cta}>
                    Открыть профиль
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Leads;
