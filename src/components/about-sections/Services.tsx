"use client";

import { FC, KeyboardEvent, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import ArrowIcon from "@/src/ui/ArrowIcon";
import { SERVICES } from "@/src/data/services";
import { PROJECTS } from "@/src/data/projects";
import scss from "./Services.module.scss";

// Homepage ServicesPreview is the teaser; this is the detail a client
// reads on /about: scope, team and real projects per service. Ordered
// by how many community projects back each service up.
const ITEMS = SERVICES.map((service) => ({
  ...service,
  projects: PROJECTS.filter((project) => project.category === service.category),
})).sort((a, b) => b.projects.length - a.projects.length);

const Services: FC = () => {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = ITEMS[active];

  // WAI-ARIA tabs: arrows move between tabs, Home/End jump to the ends.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = ITEMS.length - 1;
    const next =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? (active + 1) % ITEMS.length
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? (active - 1 + ITEMS.length) % ITEMS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className={scss.services} id="services">
      <div className="container">
        <span className={scss.services__eyebrow}>
          <span className={scss.services__index}>§ 06</span>
          Услуги
        </span>
        <h2 className={scss.services__title}>
          Как мы работаем с вашим проектом
        </h2>

        <div className={scss.layout}>
          <div
            className={scss.tabs}
            role="tablist"
            aria-label="Услуги"
            aria-orientation="vertical"
            onKeyDown={handleKeyDown}
          >
            {ITEMS.map((item, index) => {
              const selected = index === active;
              return (
                <button
                  key={item.category}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`service-tab-${item.category}`}
                  aria-selected={selected}
                  aria-controls="service-panel"
                  tabIndex={selected ? 0 : -1}
                  className={`${scss.tab} ${selected ? scss["tab--active"] : ""}`}
                  onClick={() => setActive(index)}
                >
                  {selected && (
                    <motion.span
                      layoutId="service-tab-highlight"
                      className={scss.tab__highlight}
                      transition={reduce ? { duration: 0 } : springs.snappy}
                    />
                  )}
                  <span className={scss.tab__label}>{item.title}</span>
                  <span
                    className={scss.tab__count}
                    aria-label={`Проектов: ${item.projects.length}`}
                  >
                    {item.projects.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className={scss.panel}
            role="tabpanel"
            id="service-panel"
            aria-labelledby={`service-tab-${current.category}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.category}
                initial={{
                  opacity: 0,
                  y: reduce ? 0 : motionTokens.distance.sm,
                }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  transition: { duration: motionTokens.duration.instant },
                }}
                transition={{
                  duration: motionTokens.duration.fast,
                  ease: motionTokens.easing.smooth,
                }}
              >
                <p className={scss.panel__description}>{current.description}</p>

                <div className={scss.columns}>
                  <div>
                    <h3 className={scss.panel__label}>Что входит</h3>
                    <ul className={scss.includes}>
                      {current.includes.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className={scss.panel__label}>Кто в команде</h3>
                    <ul className={scss.team}>
                      {current.team.map((role) => (
                        <li key={role}>{role}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <h3 className={scss.panel__label}>Уже сделали</h3>
                {current.projects.length > 0 ? (
                  <ul className={scss.projects}>
                    {current.projects.map((project) => (
                      <li key={project.slug}>
                        <Link href={`/projects/${project.slug}`}>
                          {project.name}
                          <ArrowIcon />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={scss.projects__empty}>
                    Здесь пока нет проектов сообщества.{" "}
                    <Link href="/projects">Смотреть все проекты</Link>
                  </p>
                )}

                <Button
                  href="/contact"
                  variant="ghost"
                  className={scss.panel__cta}
                >
                  Обсудить такой проект
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
