"use client";

import { FC, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Button from "@/src/ui/Button";
import ProjectCover from "@/src/ui/ProjectCover";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import type { ProjectListItem } from "@/src/server/api/schemas";
import scss from "./Showcase.module.scss";

// How far a covered plate shrinks, fades and lifts so its top edge peeks
// out above the plate that covers it.
const COVERED = { scale: 0.94, opacity: 0.5, lift: -28 };

interface PlateProps {
  project: ProjectListItem;
  index: number;
  steps: number;
  progress: MotionValue<number>;
  onFocus: (index: number) => void;
}

// Plate `index` slides in over segment index-1 and gets covered over
// segment index; with one segment per transition, `steps` = plates - 1.
const Plate: FC<PlateProps> = ({ project, index, steps, progress, onFocus }) => {
  const segment = 1 / Math.max(steps, 1);
  const enter = [(index - 1) * segment, index * segment];
  const cover = [index * segment, (index + 1) * segment];

  const y = useTransform(progress, enter, ["100%", "0%"]);
  const scale = useTransform(progress, cover, [1, COVERED.scale]);
  const opacity = useTransform(progress, cover, [1, COVERED.opacity]);
  const lift = useTransform(progress, cover, [0, COVERED.lift]);

  const tone = PROJECT_STATUS_TONE[project.project_status];

  return (
    <motion.div className={scss.plate} style={{ y, zIndex: index + 1 }}>
      <motion.div className={scss.plate__body} style={{ scale, opacity, y: lift }}>
        <Link
          href={`/projects/${project.id}`}
          className={scss.plate__link}
          onFocus={() => onFocus(index)}
        >
          <ProjectCover src={project.preview_image} name={project.name} bare />
          <span className={scss.plate__shade} aria-hidden="true" />

          <span className={scss.plate__top}>
            <span className={scss.plate__meta}>
              <span className={`${scss.status} ${scss[`status--${tone}`]}`}>
                {PROJECT_STATUS_LABELS[project.project_status]}
              </span>
              {project.category && (
                <span className={scss.plate__category}>{project.category}</span>
              )}
            </span>
            <span className={scss.plate__open}>Открыть проект</span>
          </span>

          <h3 className={scss.plate__name}>{project.name}</h3>
        </Link>
      </motion.div>
    </motion.div>
  );
};

const Showcase: FC<{ projects: ProjectListItem[] }> = ({ projects }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const steps = projects.length - 1;
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // Tabbing onto a plate that is still below the fold of the pinned stage
  // scrolls to the point where that plate sits on top.
  const revealPlate = (index: number) => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage || steps === 0) return;
    if (getComputedStyle(stage).position !== "sticky") return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const distance = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (distance * index) / steps });
  };

  return (
    <section id="portfolio" className={scss.showcase}>
      <div className={`container ${scss.showcase__head}`}>
        <div className={scss.showcase__intro}>
          <h2 className={scss.showcase__title}>Продукты, которые мы строим сами</h2>
          <p className={scss.showcase__lead}>
            Собственные проекты сообщества. На них участники набирают опыт,
            а компании видят, как мы работаем.
          </p>
        </div>
        <Button href="/projects" variant="ghost">
          Все проекты
        </Button>
      </div>

      <div
        ref={trackRef}
        className={`${scss.track} ${steps === 0 ? scss["track--static"] : ""}`}
        style={{ "--steps": steps } as CSSProperties}
      >
        <div ref={stageRef} className={scss.stage}>
          <div className="container">
            <div className={scss.deck}>
              {projects.map((project, index) => (
                <Plate
                  key={project.id}
                  project={project}
                  index={index}
                  steps={steps}
                  progress={scrollYProgress}
                  onFocus={revealPlate}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase;
