"use client";

import { FC, useRef } from "react";
import { motion, useScroll } from "motion/react";
import scss from "./Process.module.scss";

const STEPS = [
  {
    title: "Анализ идеи",
    description:
      "Разбираем задачу и цель продукта, оцениваем объём и сроки до старта разработки.",
  },
  {
    title: "Дизайн и архитектура",
    description:
      "Проектируем интерфейс и техническую архитектуру — фундамент, на котором всё держится дальше.",
  },
  {
    title: "Разработка и тестирование",
    description:
      "Собираем продукт короткими итерациями с код-ревью на каждом этапе, не одним большим релизом в конце.",
  },
  {
    title: "Запуск и поддержка",
    description:
      "Выкатываем в прод и остаёмся на связи — с доработками и сопровождением после запуска.",
  },
];

const Process: FC = () => {
  const rowRef = useRef<HTMLOListElement>(null);
  // The accent line fills while the row travels up the viewport.
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start 85%", "end 50%"],
  });

  return (
    <section id="pillars" className={scss.process}>
      <div className="container">
        <h2 className={scss.process__title}>Как мы работаем</h2>

        <div className={scss.rail}>
          <motion.span
            className={scss.rail__fill}
            style={{ scaleX: scrollYProgress }}
            aria-hidden="true"
          />
          <ol ref={rowRef} className={scss.steps}>
            {STEPS.map((step, index) => (
              <li key={step.title} className={scss.step}>
                <span className={scss.step__number}>{index + 1}</span>
                <h3 className={scss.step__title}>{step.title}</h3>
                <p className={scss.step__text}>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className={scss.review}>
          Каждый этап проверяют тимлиды сообщества.
        </p>
      </div>
    </section>
  );
};

export default Process;
