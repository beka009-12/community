"use client";

import { FC, ReactNode, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import { GlobalSpotlight, useMobileDetection } from "@/src/animation/MagicBento";
import Button from "@/src/ui/Button";
import scss from "./Academy.module.scss";

// Same cursor-spotlight hover glow Advantages/Pillars already use.
const GLOW_COLOR = "86, 187, 255"; // var(--color-accent) in rgb

const TRACKS = [
  { duration: "14", unit: "мес.", name: "Full-stack разработка", detail: "JavaScript и Python" },
  { duration: "15", unit: "мес.", name: "Искусственный интеллект", detail: "AI" },
  { duration: "12", unit: "мес.", name: "Кибербезопасность", detail: "Углублённый курс" },
];

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const BENEFITS: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: "Ноутбук на время обучения",
    description: "Предоставляется каждому студенту бесплатно.",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path d="M2 19h20" />
      </svg>
    ),
  },
  {
    title: "Английский и публичные выступления",
    description: "Дополнительные занятия — чтобы уверенно проходить собеседования.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 5h16M4 12h16M4 19h10" />
      </svg>
    ),
  },
  {
    title: "Помощь с трудоустройством",
    description: "Лучшим выпускникам — стажировки и работа, включая европейские компании.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <circle cx="9" cy="7" r="3.2" />
        <path d="M16 3.5c1.6.4 2.8 1.9 2.8 3.6 0 1.7-1.2 3.2-2.8 3.6" />
      </svg>
    ),
  },
  {
    title: "MotionWeb LMS и коворкинг",
    description: "Своя платформа для курсов и пространство для самостоятельной работы.",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="18" height="14" rx="1.5" />
        <path d="M9 21h6M12 17v4" />
      </svg>
    ),
  },
];

const panelVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const Academy: FC = () => {
  const reduce = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();

  return (
    <section className={scss.academy}>
      <motion.div
        className={`container ${scss.academy__inner}`}
        variants={reduce ? undefined : panelVariants}
        initial={reduce ? undefined : "hidden"}
        whileInView={reduce ? undefined : "visible"}
        viewport={{ once: true, margin: "-60px" }}
      >
        <div className={scss.academy__header}>
          <span className={scss.academy__eyebrow}>
            <span className={scss.academy__index}>§ 03</span>
            Образовательный партнёр
          </span>
          <h2 className={scss.academy__title}>Motion Web IT Academy</h2>
          <p className={scss.academy__text}>
            Международная IT-академия, основанная в 2022 году в Бишкеке. Первая
            крупная IT-академия в стране, где профессиональное обучение ведётся
            преимущественно на кыргызском языке. Официально лицензирована
            Министерством образования Кыргызской Республики.
          </p>
        </div>

        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={isMobile || !!reduce}
          spotlightRadius={220}
          glowColor={GLOW_COLOR}
        />

        <motion.div
          ref={gridRef}
          className={`${scss.academy__tracks} bento-section`}
          variants={reduce ? undefined : containerVariants}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
        >
          {TRACKS.map((track) => (
            <motion.div
              key={track.name}
              className={`${scss.track} magic-bento-card`}
              variants={reduce ? undefined : itemVariants}
            >
              <span className={scss.track__duration}>
                {track.duration}
                <span className={scss.track__unit}>{track.unit}</span>
              </span>
              <h3 className={scss.track__name}>{track.name}</h3>
              <p className={scss.track__detail}>{track.detail}</p>
            </motion.div>
          ))}
        </motion.div>

        <p className={scss.academy__note}>
          Также есть отдельные программы IT для детей и веб-дизайна.
        </p>

        <ul className={scss.academy__benefits}>
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className={scss.benefit}>
              <span className={scss.benefit__icon}>{benefit.icon}</span>
              <div>
                <h4 className={scss.benefit__title}>{benefit.title}</h4>
                <p className={scss.benefit__description}>{benefit.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className={scss.academy__footer}>
          <div className={scss.academy__contact}>
            <a href="tel:+996700232400">+996 700 23 24 00</a>
            <span>г. Бишкек, ул. Мураталы Куренкеева, 138</span>
            <span>Ежедневно 09:00–18:00</span>
          </div>

          <Button
            href="https://motion.kg"
            variant="ghost"
            external
            className={scss.academy__cta}
          >
            Перейти на motion.kg
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default Academy;
