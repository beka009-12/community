"use client";

import { FC } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import ProjectCover from "@/src/ui/ProjectCover";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import type { ProjectListItem } from "@/src/server/api/schemas";
import scss from "./Grid.module.scss";

const cardVariants = {
  hidden: { opacity: 0, y: motionTokens.distance.md },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const ProjectCard: FC<{ project: ProjectListItem }> = ({ project }) => (
  <motion.div
    layout
    variants={cardVariants}
    exit={{
      opacity: 0,
      y: motionTokens.distance.sm,
      transition: { duration: motionTokens.duration.fast },
    }}
    className={scss.card}
  >
    <Link href={`/projects/${project.id}`} className={scss.card__link}>
      <div className={scss.card__photo}>
        <ProjectCover src={project.preview_image} name={project.name} imageClassName={scss.card__image} />
        <span
          className={`${scss.card__status} ${scss[`card__status--${PROJECT_STATUS_TONE[project.project_status]}`]}`}
        >
          {PROJECT_STATUS_LABELS[project.project_status]}
        </span>
      </div>

      <div className={scss.card__body}>
        <div className={scss.card__meta}>
          <span>{project.category}</span>
        </div>
        <h3 className={scss.card__name}>{project.name}</h3>
      </div>
    </Link>
  </motion.div>
);

const Grid: FC<{ projects: ProjectListItem[] }> = ({ projects }) => {
  const reduce = useReducedMotion();

  if (projects.length === 0) {
    return (
      <div className={`container ${scss.gridWrap}`}>
        <p className={scss.empty}>
          Под этот фильтр пока ничего не попадает — попробуйте другое
          сочетание.
        </p>
      </div>
    );
  }

  return (
    <div className={`container ${scss.gridWrap}`}>
      <motion.div
        className={scss.grid}
        variants={reduce ? undefined : gridVariants}
        initial={reduce ? undefined : "hidden"}
        animate={reduce ? undefined : "visible"}
      >
        <AnimatePresence mode="popLayout">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Grid;
