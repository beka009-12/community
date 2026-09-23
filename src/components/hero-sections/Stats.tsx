"use client";

import { FC } from "react";
import { motion } from "motion/react";
import { useCountUp } from "@/src/hooks/use-count-up";
import { useSafeMotion } from "@/src/hooks/use-safe-motion";
import { springs } from "@/src/lib/motion-tokens";
import scss from "./Stats.module.scss";

const STATS = [
  { target: 120, suffix: "+", label: "участников" },
  { target: 15, suffix: "", label: "проектов" },
  { target: 8, suffix: "", label: "наймов" },
];

const StatItem: FC<(typeof STATS)[number] & { index: number }> = ({
  target,
  suffix,
  label,
  index,
}) => {
  const { ref, value } = useCountUp(target);
  const safeMotion = useSafeMotion(12);

  return (
    <motion.div
      className={scss.stat}
      initial={safeMotion.initial}
      whileInView={safeMotion.animate}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ ...springs.gentle, delay: index * 0.08 }}
    >
      <span ref={ref} className={scss.stat__value}>
        {value}
        {suffix}
      </span>
      <span className={scss.stat__label}>{label}</span>
    </motion.div>
  );
};

const Stats: FC = () => {
  return (
    <section className={scss.stats}>
      <div className={`container ${scss.stats__inner}`}>
        {STATS.map((stat, index) => (
          <StatItem key={stat.label} {...stat} index={index} />
        ))}
      </div>
    </section>
  );
};

export default Stats;
