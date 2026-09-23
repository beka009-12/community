"use client";

import { FC, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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

const Portfolio: FC = () => {
  const reduce = useReducedMotion();

  const total = PROJECTS.length;

  const [order, setOrder] = useState(() => PROJECTS.map((_, i) => i));

  const front = order[0];
  const project = PROJECTS[front];

  const advance = () => {
    setOrder((prev) => [...prev.slice(1), prev[0]]);
  };

  const goTo = (target: number) => {
    setOrder((prev) => {
      const pos = prev.indexOf(target);

      if (pos === 0) return prev;

      return [...prev.slice(pos), ...prev.slice(0, pos)];
    });
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

      <div className={`container ${scss.portfolio__inner}`}>
        <div className={scss.portfolio__intro}>
          <AnimatePresence mode="wait">
            <motion.div
              key={project.name}
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
                        scale: motionTokens.scale.press,
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

                <div className={scss.card__chrome}>
                  <div className={scss.card__chromeDots}>
                    <span
                      className={scss["card__chrome-dot"]}
                      data-color="red"
                    />
                    <span
                      className={scss["card__chrome-dot"]}
                      data-color="yellow"
                    />
                    <span
                      className={scss["card__chrome-dot"]}
                      data-color="green"
                    />
                  </div>

                  <span className={scss.card__chromeTitle}>{p.name}</span>
                </div>

                <div className={scss.card__art} data-variant={i % 3}>
                  <img
                    src={p.image}
                    alt={`${p.name} preview`}
                    className={scss.card__image}
                  />

                  <div className={scss.card__overlay} />

                  <div className={scss.card__content}>
                    <span className={scss.card__label}>Featured project</span>

                    <span className={scss.card__projectName}>{p.name}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
