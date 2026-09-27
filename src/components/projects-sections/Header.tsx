"use client";

import { FC } from "react";
import { motion } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import {
  STATUS_LABELS,
  STATUS_TONE,
  type ProjectOrigin,
  type ProjectStatus,
} from "@/src/data/projects";
import scss from "./Header.module.scss";

export type FilterKey = "all" | ProjectOrigin;
export type StatusFilterKey = "all" | ProjectStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "community", label: "Наши проекты" },
  { key: "client", label: "На заказ" },
];

// COMPLETED first — "готовые проекты" is the most likely thing someone
// filters for.
const STATUS_FILTERS: { key: StatusFilterKey; label: string }[] = [
  { key: "all", label: "Все статусы" },
  { key: "COMPLETED", label: STATUS_LABELS.COMPLETED },
  { key: "IN_PROGRESS", label: STATUS_LABELS.IN_PROGRESS },
  { key: "PLANNED", label: STATUS_LABELS.PLANNED },
  { key: "PAUSED", label: STATUS_LABELS.PAUSED },
];

interface HeaderProps {
  filter: FilterKey;
  onFilterChange: (key: FilterKey) => void;
  statusFilter: StatusFilterKey;
  onStatusFilterChange: (key: StatusFilterKey) => void;
}

const Header: FC<HeaderProps> = ({
  filter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => (
  <div className={`container ${scss.header}`}>
    <span className={scss.header__eyebrow}>Portfolio</span>
    <h1 className={scss.header__title}>Все проекты</h1>
    <p className={scss.header__subtitle}>
      Проекты, которые сообщество делает для себя, и проекты, которые мы
      берём в разработку на заказ.
    </p>

    <div
      className={scss.header__tabs}
      role="group"
      aria-label="Фильтр проектов"
    >
      {FILTERS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={scss.tab}
          aria-pressed={filter === item.key}
          onClick={() => onFilterChange(item.key)}
        >
          {filter === item.key && (
            <motion.span
              layoutId="projects-filter-pill"
              className={scss.tab__pill}
              transition={springs.snappy}
            />
          )}
          <span
            className={`${scss.tab__label} ${filter === item.key ? scss["tab__label--active"] : ""}`}
          >
            {item.label}
          </span>
        </button>
      ))}
    </div>

    <div
      className={scss.header__statusTabs}
      role="group"
      aria-label="Фильтр по статусу"
    >
      {STATUS_FILTERS.map((item) => {
        const isActive = statusFilter === item.key;
        const tone = item.key === "all" ? null : STATUS_TONE[item.key];

        return (
          <button
            key={item.key}
            type="button"
            className={`${scss.statusTab} ${tone ? scss[`statusTab--${tone}`] : ""}`}
            aria-pressed={isActive}
            onClick={() => onStatusFilterChange(item.key)}
          >
            {tone && <span className={scss.statusTab__dot} aria-hidden="true" />}
            {item.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default Header;
