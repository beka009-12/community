"use client";

import { FC } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "@/src/lib/motion-tokens";
import ProjectCover from "@/src/ui/ProjectCover";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import type { ProjectListItem } from "@/src/server/api/schemas";
import scss from "./ProjectPath.module.scss";

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
// member's track record. The API doesn't say which role they had in each
// project, so there's no role badge.
const ProjectPath: FC<{ projects: ProjectListItem[] }> = ({ projects }) => {
  const reduce = useReducedMotion();

  if (projects.length === 0) {
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
      {projects.map((project) => {
        const tone = PROJECT_STATUS_TONE[project.project_status];
        return (
          <motion.li key={project.id} className={scss.step} variants={itemVariants}>
            <span className={`${scss.step__node} ${scss[`tone--${tone}`]}`} aria-hidden="true" />
            <Link href={`/projects/${project.id}`} className={scss.step__link}>
              <div className={scss.step__body}>
                <div className={scss.step__meta}>
                  <span className={scss[`tone--${tone}`]}>
                    {PROJECT_STATUS_LABELS[project.project_status]}
                  </span>
                  <span className={scss.step__role}>{project.category}</span>
                </div>
                <h3 className={scss.step__name}>{project.name}</h3>
              </div>
              <span className={scss.step__thumb}>
                <ProjectCover src={project.preview_image} name={project.name} />
              </span>
            </Link>
          </motion.li>
        );
      })}
    </motion.ol>
  );
};

export default ProjectPath;
