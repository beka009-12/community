"use client";

import { FC, useCallback, useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { springs, motionTokens } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import scss from "./Portfolio.module.scss";

const PROJECTS = [
  {
    name: "Amanat",
    description:
      "Платформа учёта и прозрачной отчётности для благотворительных сборов.",
    details:
      "Система помогает создавать сборы, отслеживать поступления и формировать понятные отчёты для пользователей и администраторов.",
    stack: ["React", "FastAPI", "PostgreSQL"],
    type: "Web Platform",
    year: "2026",
    image:
      "https://media.licdn.com/dms/image/v2/D5612AQFXy7QydmMrhA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1685812646776?e=2147483647&v=beta&t=YyZLphSZuSvI9YR3nT_pnQyC32MibQBOiHzkXgLm2PA",
  },
  {
    name: "IBO",
    description:
      "Информационная система для управления школьным документооборотом.",
    details:
      "Централизованная система для работы с документами, пользователями и внутренними процессами образовательной организации.",
    stack: ["React", "NestJS", "PostgreSQL"],
    type: "Management System",
    year: "2026",
    image:
      "https://media.licdn.com/dms/image/v2/D5612AQFXy7QydmMrhA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1685812646776?e=2147483647&v=beta&t=YyZLphSZuSvI9YR3nT_pnQyC32MibQBOiHzkXgLm2PA",
  },
  {
    name: "Tabel",
    description: "Сервис учёта рабочего времени и посещаемости для команд.",
    details:
      "Автоматизирует регистрацию посещаемости, хранение истории и формирование статистики по сотрудникам и рабочему времени.",
    stack: ["React", "FastAPI", "OpenCV"],
    type: "Automation",
    year: "2026",
    image:
      "https://media.licdn.com/dms/image/v2/D5612AQFXy7QydmMrhA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1685812646776?e=2147483647&v=beta&t=YyZLphSZuSvI9YR3nT_pnQyC32MibQBOiHzkXgLm2PA",
  },
] as const;

// Намного меньше смещение.
// Задние карточки будут показывать только угол.
const PEEK = {
  x: 26,
  y: -22,
  scale: 0.965,
};

type Project = (typeof PROJECTS)[number];

const ProjectFace: FC<{
  project: Project;
  index: number;
}> = ({ project, index }) => (
  <>
    <div className={scss.card__chrome}>
      <div className={scss.card__chromeDots}>
        <span className={scss["card__chrome-dot"]} data-color="red" />
        <span className={scss["card__chrome-dot"]} data-color="yellow" />
        <span className={scss["card__chrome-dot"]} data-color="green" />
      </div>

      <span className={scss.card__chromeTitle}>{project.name}</span>
    </div>

    <div className={scss.card__art} data-variant={index % 3}>
      <img
        src={project.image}
        alt={`${project.name} preview`}
        className={scss.card__image}
      />

      <div className={scss.card__overlay} />

      <div className={scss.card__content}>
        <span className={scss.card__label}>Featured project</span>

        <div className={scss.card__footer}>
          <span className={scss.card__projectName}>{project.name}</span>
        </div>
      </div>
    </div>
  </>
);

// ≤1024px: just the photo, no browser-chrome framing. Name + a short
// description sit directly on the image over a readable gradient scrim —
// the fuller write-up (details, stack, CTA) stays desktop-only, where
// it lives beside the card stack instead of crowding a phone screen.
const ProjectPhoto: FC<{ project: Project }> = ({ project }) => (
  <>
    <img
      src={project.image}
      alt={`${project.name} preview`}
      className={scss.photo__image}
    />

    <div className={scss.photo__overlay} />

    <div className={scss.photo__caption}>
      <h3 className={scss.photo__name}>{project.name}</h3>
      <p className={scss.photo__description}>{project.description}</p>

      {/* Stops the tap reaching the drag handle around it — otherwise the
          swipe gesture claims the pointer and the link never gets a
          click. */}
      <div onPointerDown={(e) => e.stopPropagation()}>
        <Button href="/projects" variant="primary" className={scss.photo__cta}>
          Смотреть проект
        </Button>
      </div>
    </div>
  </>
);

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;
const AUTO_ROTATE_MS = 2400;

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 32 : -32,
    opacity: 0,
    scale: 0.97,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -32 : 32,
    opacity: 0,
    scale: 0.97,
  }),
};

const Portfolio: FC = () => {
  const reduce = useReducedMotion();

  const total = PROJECTS.length;

  const [order, setOrder] = useState(() => PROJECTS.map((_, i) => i));
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const front = order[0];
  const project = PROJECTS[front];

  const advance = useCallback(() => {
    setDirection(1);
    setOrder((prev) => [...prev.slice(1), prev[0]]);
  }, []);

  const retreat = () => {
    setDirection(-1);
    setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
  };

  // Auto-rotates the front card every 3.4s. Paused on hover/focus so a
  // reader isn't fighting the carousel, skipped entirely under
  // prefers-reduced-motion, and reset whenever the front card changes
  // (auto or manual) so a click never gets overridden a moment later.
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(advance, AUTO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [advance, front, reduce, paused]);

  const goTo = (target: number) => {
    setOrder((prev) => {
      const pos = prev.indexOf(target);

      if (pos === 0) return prev;

      setDirection(pos <= prev.length - pos ? 1 : -1);

      return [...prev.slice(pos), ...prev.slice(0, pos)];
    });
  };

  const handleSwipe = (
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      advance();
    } else if (
      info.offset.x > SWIPE_DISTANCE ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      retreat();
    }
  };

  return (
    <section id="portfolio" className={scss.portfolio}>
      <div className={`container ${scss.portfolio__header}`}>
        <span className={scss.portfolio__eyebrow}>Portfolio</span>

        <h2 className={scss.portfolio__title}>Флагманские проекты</h2>

        <p className={scss.portfolio__subtitle}>
          Несколько проектов, в которых мы превращали идеи в полноценные
          цифровые продукты.
        </p>
      </div>

      <div
        className={`container ${scss.portfolio__inner}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setPaused(false);
          }
        }}
      >
        <div className={scss.portfolio__intro}>
          <AnimatePresence mode="wait">
            <motion.div
              key={project.name}
              className={scss.portfolio__info}
              initial={{
                opacity: 0,
                y: motionTokens.distance.sm,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: motionTokens.distance.sm,
              }}
              transition={springs.instant}
            >
              <div className={scss.portfolio__meta}>
                <span>{project.type}</span>
                <span>{project.year}</span>
              </div>

              <h3 className={scss.portfolio__name}>{project.name}</h3>

              <p className={scss.portfolio__description}>
                {project.description}
              </p>

              <p className={scss.portfolio__details}>{project.details}</p>

              <ul className={scss.portfolio__stack}>
                {project.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>

              <Button
                href="/projects"
                variant="ghost"
                className={scss.portfolio__cta}
              >
                Смотреть проект
              </Button>
            </motion.div>
          </AnimatePresence>

          <div className={scss.dots} role="group" aria-label="Проект">
            {PROJECTS.map((p, i) => (
              <button
                key={p.name}
                type="button"
                className={`${scss.dot} ${
                  i === front ? scss["dot--active"] : ""
                }`}
                aria-label={`Показать: ${p.name}`}
                aria-current={i === front}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>

        <div className={scss.stack}>
          {PROJECTS.map((p, i) => {
            const pos = order.indexOf(i);
            const isFront = pos === 0;

            return (
              <motion.div
                key={p.name}
                className={`${scss.card} ${isFront ? scss["card--front"] : ""}`}
                style={{
                  zIndex: total - pos,
                }}
                animate={
                  reduce
                    ? {
                        x: 0,
                        y: 0,
                        scale: 1,
                      }
                    : isFront
                      ? {
                          x: 0,
                          y: 0,
                          scale: 1,
                        }
                      : {
                          x: PEEK.x * pos,
                          y: PEEK.y * pos,
                          scale: Math.pow(PEEK.scale, pos),
                        }
                }
                whileHover={
                  isFront
                    ? {
                        scale: 1.02,
                        x: -8,
                        y: 8,
                      }
                    : undefined
                }
                whileTap={
                  isFront
                    ? {
                        scale: motionTokens.scale.subtle,
                      }
                    : undefined
                }
                transition={springs.snappy}
              >
                {isFront && (
                  <button
                    type="button"
                    className={scss.card__hit}
                    aria-label="Следующий проект"
                    onClick={advance}
                  />
                )}

                <ProjectFace project={p} index={i} />
              </motion.div>
            );
          })}
        </div>

        <div className={scss.mobileSlider}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={project.name}
              className={scss.mobileSlider__card}
              custom={direction}
              variants={reduce ? undefined : slideVariants}
              initial={reduce ? undefined : "enter"}
              animate={reduce ? undefined : "center"}
              exit={reduce ? undefined : "exit"}
              transition={springs.snappy}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.65}
              onDragEnd={handleSwipe}
              whileDrag={{ scale: 0.97 }}
            >
              <ProjectPhoto project={project} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className={`container ${scss.portfolio__footer}`}>
        <Button href="/projects" variant="ghost">
          Смотреть все проекты
        </Button>
      </div>
    </section>
  );
};

export default Portfolio;
