"use client";

import { FC, ReactNode, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import { GlobalSpotlight, useMobileDetection } from "@/src/animation/MagicBento";
import scss from "./Advantages.module.scss";

// Same cursor-spotlight hover glow "How we work" already uses on the
// homepage (Pillars) — reused here instead of a one-off hover style.
const GLOW_COLOR = "86, 187, 255"; // var(--color-accent) in rgb

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// Paraphrases of claims already made elsewhere on the site (Stats,
// CommunityPreview) — nothing new is asserted here, just restated for
// someone who lands directly on /about.
const ADVANTAGES: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: "Реальные проекты, а не учебные",
    description: "Портфолио строится на проектах, которые реально идут в прод.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path d="M3 13l9 5 9-5" />
      </svg>
    ),
  },
  {
    title: "Ревью на каждом этапе",
    description:
      "Тимлиды принимают архитектурные решения и проверяют код каждого участника.",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.4 12.3 11 15l4.6-6" />
      </svg>
    ),
  },
  {
    title: "Уже проверенные люди",
    description: "Компании нанимают не по резюме, а по тому, что человек реально сделал.",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3 2.7-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
        <circle cx="17.5" cy="9" r="2.2" />
        <path d="M16.2 14.2c2.1.5 3.4 1.9 3.8 4.1" />
      </svg>
    ),
  },
];

const Advantages: FC = () => {
  const reduce = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();

  return (
    <section className={scss.advantages}>
      <div className={`container ${scss.advantages__inner}`}>
        <span className={scss.advantages__eyebrow}>
          <span className={scss.advantages__index}>§ 04</span>
          Почему мы
        </span>
        <h2 className={scss.advantages__title}>Что нас отличает</h2>

        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={isMobile || !!reduce}
          spotlightRadius={220}
          glowColor={GLOW_COLOR}
        />

        <motion.div
          ref={gridRef}
          className={`${scss.advantages__grid} bento-section`}
          variants={reduce ? undefined : containerVariants}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
        >
          {ADVANTAGES.map((item) => (
            <motion.div
              key={item.title}
              className={`${scss.advantage} magic-bento-card`}
              variants={reduce ? undefined : itemVariants}
            >
              <span className={scss.advantage__icon}>{item.icon}</span>
              <h3 className={scss.advantage__title}>{item.title}</h3>
              <p className={scss.advantage__description}>{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Advantages;
