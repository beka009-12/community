"use client";

import { FC, ReactNode } from "react";
import { useCountUp } from "@/src/hooks/use-count-up";
import { plural } from "@/src/lib/plural";
import type { Stats as StatsData } from "@/src/server/api/schemas";
import scss from "./Stats.module.scss";

type StatId = "members" | "projects" | "companies";

interface StatItemProps {
  id: StatId;
  value: number;
  label: string;
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ICONS: Record<StatId, ReactNode> = {
  members: (
    <svg {...ICON_PROPS}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.7-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
      <circle cx="17.5" cy="9" r="2.2" />
      <path d="M16.2 14.2c2.1.5 3.4 1.9 3.8 4.1" />
    </svg>
  ),
  projects: (
    <svg {...ICON_PROPS}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  ),
  companies: (
    <svg {...ICON_PROPS}>
      <path d="M4 20V6.5L12 3l8 3.5V20" />
      <path d="M9 20v-5h6v5" />
      <path d="M8 9h.01M12 9h.01M16 9h.01M8 12.5h.01M16 12.5h.01" />
    </svg>
  ),
};

const StatItem: FC<StatItemProps> = ({ id, value, label }) => {
  const { ref, value: shown } = useCountUp(value);

  return (
    <div className={scss.stat}>
      <span className={scss.stat__icon}>{ICONS[id]}</span>
      <div className={scss.stat__body}>
        <span ref={ref} className={scss.stat__value}>
          {shown}
        </span>
        <span className={scss.stat__label}>{label}</span>
      </div>
    </div>
  );
};

// Live numbers from GET /stats/, shown exactly.
const Stats: FC<{ stats: StatsData }> = ({ stats }) => {
  const items: StatItemProps[] = [
    {
      id: "members",
      value: stats.members_count,
      label: plural(stats.members_count, "участник", "участника", "участников"),
    },
    {
      id: "projects",
      value: stats.projects_count,
      label: plural(stats.projects_count, "проект", "проекта", "проектов"),
    },
    {
      id: "companies",
      value: stats.companies_count,
      label: plural(stats.companies_count, "компания", "компании", "компаний"),
    },
  ];

  return (
    <section className={scss.stats}>
      <div className={`container ${scss.stats__inner}`}>
        <div className={scss.stats__intro}>
          <span className={scss.stats__eyebrow}>Сообщество в цифрах</span>
          <p className={scss.stats__lead}>
            Каждый в сообществе проходит реальные проекты и ревью тимлидов —
            поэтому мы уверены, кого рекомендуем.
          </p>
        </div>

        <div className={scss.stats__grid}>
          {items.map((item) => (
            <StatItem key={item.id} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
