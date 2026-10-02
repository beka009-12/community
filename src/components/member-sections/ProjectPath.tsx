"use client";

import { FC } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "@/src/lib/motion-tokens";
import { STATUS_LABELS, STATUS_TONE } from "@/src/data/projects";
import type { MemberProject, ProjectRole } from "@/src/data/teams";
import scss from "./ProjectPath.module.scss";

const ROLE_LABELS: Record<ProjectRole, string> = {
  TEAM_LEAD: "Тимлид",
  DEVELOPER: "Разработчик",
};

const STAGGER = 0.1;

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER, delayChildren: STAGGER } },
};

const itemVariants = {
  hidden: { opacity: 0.25 },
  visible: {
    opacity: 1,
    transition: { duration: motionTokens.duration.normal },
  },
};

const railVariants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.easing.smooth,
    },
  },
};

// Same rail-and-nodes motif as the /login path panel, here as this
// member's own track record. The page's one motion moment: the rail
// draws in once when it scrolls into view and each project lights up.
const ProjectPath: FC<{ items: MemberProject[] }> = ({ items }) => {
  const reduce = useReducedMotion();

  if (items.length === 0) {
    return (
      <p className={scss.empty}>
        Участник пока не входил в команды проектов сообщества.
      </p>
    );
  }

  return (
    <motion.ol
      className={scss.path}
      variants={listVariants}
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      <motion.span
        className={scss.path__rail}
        aria-hidden="true"
        variants={railVariants}
      />
      {items.map(({ project, role }) => (
        <motion.li
          key={project.slug}
          className={scss.step}
          variants={itemVariants}
        >
          <span
            className={`${scss.step__node} ${scss[`tone--${STATUS_TONE[project.status]}`]}`}
            aria-hidden="true"
          />
          <Link href={`/projects/${project.slug}`} className={scss.step__link}>
            <div className={scss.step__body}>
              <div className={scss.step__meta}>
                <span className={scss[`tone--${STATUS_TONE[project.status]}`]}>
                  {STATUS_LABELS[project.status]}
                </span>
                <span className={scss.step__role}>{ROLE_LABELS[role]}</span>
              </div>
              <h3 className={scss.step__name}>{project.name}</h3>
              <p className={scss.step__description}>{project.description}</p>
            </div>
            {/* External placeholder images on various hosts — same plain
                <img> as projects-sections/Grid. */}
            <img
              src={project.image}
              alt=""
              width={144}
              height={90}
              loading="lazy"
              className={scss.step__image}
            />
          </Link>
        </motion.li>
      ))}
    </motion.ol>
  );
};

export default ProjectPath;
