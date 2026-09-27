"use client";

import { FC, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import ArrowIcon from "@/src/ui/ArrowIcon";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_TONE,
  type Project,
} from "@/src/data/projects";
import scss from "./EditorialList.module.scss";

// Desktop-only (≥960px, toggled purely in CSS — see .list). Mobile/tablet
// keep the plain card grid; a cursor-follow preview has no touch
// equivalent, so it isn't worth forking the interaction for small screens.
const EditorialList: FC<{ projects: Project[] }> = ({ projects }) => {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const springX = useSpring(mvX, { stiffness: 300, damping: 30, mass: 0.5 });
  const springY = useSpring(mvY, { stiffness: 300, damping: 30, mass: 0.5 });

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // Offset up-and-right so the preview never sits under the pointer.
    mvX.set(event.clientX - rect.left + 28);
    mvY.set(event.clientY - rect.top - 150);
  };

  const hoveredProject = projects.find((project) => project.slug === hovered);

  if (projects.length === 0) {
    return (
      <div className={`container ${scss.listWrap}`}>
        <p className={scss.empty}>
          Под этот фильтр пока ничего не попадает — попробуйте другое
          сочетание.
        </p>
      </div>
    );
  }

  return (
    <div className={`container ${scss.listWrap}`}>
      <div
        className={scss.list}
        onMouseMove={reduce ? undefined : handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {projects.map((project, index) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className={scss.row}
            data-dimmed={hovered !== null && hovered !== project.slug}
            onMouseEnter={() => setHovered(project.slug)}
          >
            <span className={scss.row__index}>
              {String(index + 1).padStart(2, "0")}
            </span>

            <span
              className={`${scss.row__name} ${hovered === project.slug ? scss["row__name--active"] : ""}`}
            >
              {project.name}
            </span>

            <span className={scss.row__meta}>
              <span
                className={`${scss.status} ${scss[`status--${STATUS_TONE[project.status]}`]}`}
              >
                {STATUS_LABELS[project.status]}
              </span>
              <span>{CATEGORY_LABELS[project.category]}</span>
              <span>{project.year}</span>
            </span>

            <ArrowIcon direction="right" className={scss.row__arrow} />
          </Link>
        ))}

        {!reduce && (
          <AnimatePresence>
            {hoveredProject && (
              <motion.div
                key={hoveredProject.slug}
                className={scss.preview}
                style={{ x: springX, y: springY }}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={hoveredProject.image}
                  alt=""
                  className={scss.preview__image}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default EditorialList;
