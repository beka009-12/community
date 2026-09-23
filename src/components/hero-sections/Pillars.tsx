"use client";

import { FC } from "react";
import { motion } from "motion/react";
import { useSafeMotion } from "@/src/hooks/use-safe-motion";
import { springs } from "@/src/lib/motion-tokens";
import scss from "./Pillars.module.scss";

const STEPS = [
  {
    index: "01",
    title: "Анализ идеи",
    description:
      "Разбираем задачу и цель продукта, оцениваем объём и сроки до старта разработки.",
  },
  {
    index: "02",
    title: "Дизайн и архитектура",
    description:
      "Проектируем интерфейс и техническую архитектуру — фундамент, на котором всё держится дальше.",
  },
  {
    index: "03",
    title: "Разработка и тестирование",
    description:
      "Собираем продукт короткими итерациями с код-ревью на каждом этапе, не одним большим релизом в конце.",
  },
  {
    index: "04",
    title: "Запуск и поддержка",
    description:
      "Выкатываем в прод и остаёмся на связи — с доработками и сопровождением после запуска.",
  },
];

const Pillars: FC = () => {
  const safeMotion = useSafeMotion(16);

  return (
    <section id="pillars" className={scss.pillars}>
      <div className={`container ${scss.pillars__inner}`}>
        <h2 className={scss.pillars__heading}>Как мы работаем</h2>

        <div className={scss.pillars__grid}>
          {STEPS.map((step, i) => (
            <motion.article
              key={step.index}
              className={scss.pillar}
              initial={safeMotion.initial}
              whileInView={safeMotion.animate}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ ...springs.gentle, delay: i * 0.1 }}
            >
              <span className={scss.pillar__index}>{step.index}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </motion.article>
          ))}
        </div>

        <p className={scss.pillars__note}>
          Каждый этап проходит через код-ревью менторов и тимлидов — контроль
          качества встроен в процесс, а не добавлен постфактум.
        </p>
      </div>
    </section>
  );
};

export default Pillars;
