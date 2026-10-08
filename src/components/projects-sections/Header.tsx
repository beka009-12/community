"use client";

import { FC } from "react";
import { motion } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import type { ProjectStatus } from "@/src/lib/api-enums";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import scss from "./Header.module.scss";

// Completed first — "готовые проекты" is the most likely thing someone
// filters for.
const STATUS_ORDER: ProjectStatus[] = ["Completed", "In_progress", "Planned", "Paused"];

interface HeaderProps {
  categories: string[];
  category: string | null;
  onCategoryChange: (category: string | null) => void;
  status: ProjectStatus | null;
  onStatusChange: (status: ProjectStatus | null) => void;
}

const Header: FC<HeaderProps> = ({
  categories,
  category,
  onCategoryChange,
  status,
  onStatusChange,
}) => {
  const tabs: { key: string | null; label: string }[] = [
    { key: null, label: "Все" },
    ...categories.map((item) => ({ key: item, label: item })),
  ];
  const statusTabs: { key: ProjectStatus | null; label: string }[] = [
    { key: null, label: "Все статусы" },
    ...STATUS_ORDER.map((key) => ({ key, label: PROJECT_STATUS_LABELS[key] })),
  ];

  return (
    <div className={`container ${scss.header}`}>
      <span className={scss.header__eyebrow}>Portfolio</span>
      <h1 className={scss.header__title}>Все проекты</h1>
      <p className={scss.header__subtitle}>
        Проекты, которые сообщество делает для себя, и проекты, которые мы
        берём в разработку на заказ.
      </p>

      <div className={scss.header__tabs} role="group" aria-label="Фильтр по категории">
        {tabs.map((item) => {
          const active = category === item.key;
          return (
            <button
              key={item.key ?? "all"}
              type="button"
              className={scss.tab}
              aria-pressed={active}
              onClick={() => onCategoryChange(item.key)}
            >
              {active && (
                <motion.span
                  layoutId="projects-filter-pill"
                  className={scss.tab__pill}
                  transition={springs.snappy}
                />
              )}
              <span className={`${scss.tab__label} ${active ? scss["tab__label--active"] : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className={scss.header__statusTabs} role="group" aria-label="Фильтр по статусу">
        {statusTabs.map((item) => {
          const tone = item.key ? PROJECT_STATUS_TONE[item.key] : null;
          return (
            <button
              key={item.key ?? "all"}
              type="button"
              className={`${scss.statusTab} ${tone ? scss[`statusTab--${tone}`] : ""}`}
              aria-pressed={status === item.key}
              onClick={() => onStatusChange(item.key)}
            >
              {tone && <span className={scss.statusTab__dot} aria-hidden="true" />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Header;
