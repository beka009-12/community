"use client";

import { FC, ReactNode } from "react";
import { useCountUp } from "@/src/hooks/use-count-up";
import { STATS, type StatId } from "@/src/data/stats";
import scss from "./Stats.module.scss";

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
  hires: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.4 12.3 11 15l4.6-6" />
    </svg>
  ),
};

const StatItem: FC<(typeof STATS)[number]> = ({ id, target, suffix, label }) => {
  const { ref, value } = useCountUp(target);

  return (
    <div className={scss.stat}>
      <span className={scss.stat__icon}>{ICONS[id]}</span>
      <div className={scss.stat__body}>
        <span ref={ref} className={scss.stat__value}>
          {value}
          {suffix}
        </span>
        <span className={scss.stat__label}>{label}</span>
      </div>
    </div>
  );
};

const Stats: FC = () => {
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
          {STATS.map((stat) => (
            <StatItem key={stat.id} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
