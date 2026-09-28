"use client";

import { FC, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import { GlobalSpotlight, useMobileDetection } from "@/src/animation/MagicBento";
import { SPECIALIZATIONS } from "@/src/data/specializations";
import { SPECIALIZATION_ICONS } from "./specialization-icons";
import scss from "./Specializations.module.scss";

// Same cursor-spotlight hover glow Pillars/Advantages/Academy already use.
const GLOW_COLOR = "86, 187, 255"; // var(--color-accent) in rgb

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const Specializations: FC = () => {
  const reduce = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();

  return (
    <section className={scss.specializations}>
      <div className={`container ${scss.specializations__inner}`}>
        <h2 className={scss.specializations__title}>Направления в команде</h2>
        <p className={scss.specializations__lead}>
          Каждое направление ведёт тимлид с реальным опытом — он принимает
          архитектурные решения и проверяет код каждого участника.
        </p>

        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={isMobile || !!reduce}
          spotlightRadius={220}
          glowColor={GLOW_COLOR}
        />

        <motion.div
          ref={gridRef}
          className={`${scss.grid} bento-section`}
          variants={reduce ? undefined : containerVariants}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
        >
          {SPECIALIZATIONS.map((spec) => (
            <motion.div
              key={spec.id}
              className={`${scss.card} magic-bento-card`}
              variants={reduce ? undefined : itemVariants}
            >
              <span className={scss.card__icon}>{SPECIALIZATION_ICONS[spec.id]}</span>
              <h3 className={scss.card__title}>{spec.title}</h3>
              <p className={scss.card__description}>{spec.description}</p>
              <span className={scss.card__stack}>{spec.stack}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Specializations;
