"use client";

import { FC, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Button from "@/src/ui/Button";
import ProjectCover from "@/src/ui/ProjectCover";
import ProjectPath from "@/src/ui/ProjectPath";
import { slideIndex } from "@/src/lib/project-path";
import type { ProjectDetail } from "@/src/server/api/schemas";
import { plateRanges, type Range } from "./showcase-ranges";
import scss from "./Showcase.module.scss";

// How far a covered plate shrinks, darkens and lifts so its top edge peeks
// out above the plate that covers it. Darkening is an overlay, not opacity:
// a translucent plate would let the plates stacked under it show through.
const COVERED = { scale: 0.94, dim: 0.5, lift: -28 };

export type ShowcaseProject = Pick<
  ProjectDetail,
  "id" | "name" | "category" | "project_status" | "preview_image" | "description"
>;

interface PlateProps {
  project: ShowcaseProject;
  index: number;
  steps: number;
  progress: MotionValue<number>;
  onFocus: (index: number) => void;
}

// Hooks can't be skipped, so a plate without a range maps the whole
// progress onto one constant value.
const STILL: Range = [0, 1];

const Plate: FC<PlateProps> = ({ project, index, steps, progress, onFocus }) => {
  const { enter, cover } = plateRanges(index, steps);

  const y = useTransform(progress, enter ?? STILL, enter ? ["100%", "0%"] : ["0%", "0%"]);
  const scale = useTransform(progress, cover ?? STILL, cover ? [1, COVERED.scale] : [1, 1]);
  const dim = useTransform(progress, cover ?? STILL, cover ? [0, COVERED.dim] : [0, 0]);
  const lift = useTransform(progress, cover ?? STILL, cover ? [0, COVERED.lift] : [0, 0]);

  return (
    <motion.div className={scss.plate} style={{ y, zIndex: index + 1 }}>
      <motion.div className={scss.plate__body} style={{ scale, y: lift }}>
        <Link
          href={`/projects/${project.id}`}
          className={scss.plate__link}
          // Mouse presses focus links too; only keyboard focus should scroll.
          onFocus={(event) => {
            if (event.currentTarget.matches(":focus-visible")) onFocus(index);
          }}
        >
          <ProjectCover src={project.preview_image} name={project.name} bare />
          <span className={scss.plate__shade} aria-hidden="true" />

          <ProjectPath status={project.project_status} className={scss.plate__path} />
          <span className={scss.plate__open}>Открыть проект</span>

          <span className={scss.plate__bottom}>
            {project.category && (
              <span className={scss.plate__category}>{project.category}</span>
            )}
            <h3 className={scss.plate__name}>{project.name}</h3>
            {project.description && (
              <span className={scss.plate__description}>{project.description}</span>
            )}
          </span>
        </Link>
        <motion.span className={scss.plate__dim} style={{ opacity: dim }} aria-hidden="true" />
      </motion.div>
    </motion.div>
  );
};

const Showcase: FC<{ projects: ShowcaseProject[] }> = ({ projects }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
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

  // ≤768px the deck is a full-screen, one-at-a-time carousel (horizontal
  // scroll-snap); one step is a plate plus any gap, measured from the first
  // two plates.
  const slideStep = (deck: HTMLDivElement): number => {
    const [first, second] = Array.from(deck.children) as HTMLElement[];
    if (!first) return 0;
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  };

  const syncSlide = () => {
    const deck = deckRef.current;
    if (deck) setSlide(slideIndex(deck.scrollLeft, slideStep(deck), projects.length));
  };

  const goToSlide = (index: number) => {
    const deck = deckRef.current;
    if (deck) deck.scrollTo({ left: slideStep(deck) * index });
  };

  return (
    <section id="portfolio" className={scss.showcase}>
      <div className={`container ${scss.showcase__head}`}>
        <div>
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
          <div className={`container ${scss.carousel}`}>
            <div ref={deckRef} className={scss.deck} onScroll={syncSlide}>
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

            <div className={scss.slider}>
              <span className={scss.slider__count}>
                <b>{slide + 1}</b> / {projects.length}
              </span>
              <span className={scss.slider__bar} aria-hidden="true">
                <span
                  className={scss.slider__fill}
                  style={{ transform: `scaleX(${(slide + 1) / projects.length})` }}
                />
              </span>
              <span className={scss.slider__arrows}>
                <button
                  type="button"
                  className={scss.slider__arrow}
                  aria-label="Предыдущий проект"
                  disabled={slide === 0}
                  onClick={() => goToSlide(slide - 1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={scss.slider__arrow}
                  aria-label="Следующий проект"
                  disabled={slide === projects.length - 1}
                  onClick={() => goToSlide(slide + 1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase;
