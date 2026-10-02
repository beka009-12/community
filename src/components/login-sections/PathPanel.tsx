"use client";

import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "@/src/lib/motion-tokens";
import scss from "./PathPanel.module.scss";

// The platform's core idea from the spec, verbatim:
// Участник → команда → реальный проект → опыт → портфолио → новые возможности.
const PATH = [
  "Участник",
  "Команда",
  "Реальный проект",
  "Опыт",
  "Портфолио",
  "Новые возможности",
];

const STEP_DELAY = motionTokens.duration.crawl / PATH.length;

// The page's one orchestrated moment: the rail draws top to bottom and
// each step lights up as the line reaches it.
const PathPanel: FC = () => {
  const reduce = useReducedMotion();

  return (
    <aside className={scss.panel}>
      <Link href="/" className={scss.panel__logo} aria-label="Motion Community — на главную">
        <Image src="/brand/motion-logo.svg" alt="" width={253} height={134} priority />
      </Link>

      <ol className={scss.path} aria-label="Путь участника">
        <motion.span
          className={scss.path__rail}
          aria-hidden="true"
          initial={reduce ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            duration: motionTokens.duration.crawl,
            ease: motionTokens.easing.smooth,
          }}
        />
        {PATH.map((step, index) => (
          <motion.li
            key={step}
            className={`${scss.step} ${index === PATH.length - 1 ? scss["step--last"] : ""}`}
            initial={reduce ? false : { opacity: 0.25 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: motionTokens.duration.normal,
              delay: index * STEP_DELAY,
            }}
          >
            <span className={scss.step__node} aria-hidden="true" />
            {step}
          </motion.li>
        ))}
      </ol>

      <p className={scss.panel__note}>
        Закрытая платформа для студентов и выпускников Motion
      </p>
    </aside>
  );
};

export default PathPanel;
