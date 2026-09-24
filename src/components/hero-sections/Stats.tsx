"use client";

import { FC } from "react";
import { useCountUp } from "@/src/hooks/use-count-up";
import scss from "./Stats.module.scss";

const STATS = [
  { target: 120, suffix: "+", label: "участников" },
  { target: 15, suffix: "", label: "проектов" },
  { target: 8, suffix: "", label: "наймов" },
];

const StatItem: FC<(typeof STATS)[number]> = ({ target, suffix, label }) => {
  const { ref, value } = useCountUp(target);

  return (
    <div className={scss.stat}>
      <span ref={ref} className={scss.stat__value}>
        {value}
        {suffix}
      </span>
      <span className={scss.stat__label}>{label}</span>
    </div>
  );
};

const Stats: FC = () => {
  return (
    <section className={scss.stats}>
      <div className={`container ${scss.stats__inner}`}>
        {STATS.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
};

export default Stats;
