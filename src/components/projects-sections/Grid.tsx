"use client";

import { FC } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
  type Project,
} from "@/src/data/projects";
import scss from "./Grid.module.scss";

const cardVariants = {
  hidden: { opacity: 0, y: motionTokens.distance.md },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const ProjectCard: FC<{ project: Project }> = ({ project }) => (
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
    <Link href={`/projects/${project.slug}`} className={scss.card__link}>
      <div className={scss.card__photo}>
        <img
          src={project.image}
          alt={`${project.name} preview`}
          className={scss.card__image}
        />
        <span
          className={`${scss.card__status} ${scss[`card__status--${STATUS_TONE[project.status]}`]}`}
        >
          {STATUS_LABELS[project.status]}
        </span>
      </div>

      <div className={scss.card__body}>
        <div className={scss.card__meta}>
          <span>{CATEGORY_LABELS[project.category]}</span>
          <span>{project.year}</span>
        </div>

        <h3 className={scss.card__name}>{project.name}</h3>
        <p className={scss.card__description}>{project.description}</p>

        <ul className={scss.card__stack}>
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </div>
    </Link>
  </motion.div>
);

const Grid: FC<{ projects: Project[] }> = ({ projects }) => {
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
            <ProjectCard key={project.slug} project={project} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Grid;
