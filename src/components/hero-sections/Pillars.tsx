"use client";

import { FC, useRef } from "react";
import { useSafeMotion } from "@/src/hooks/use-safe-motion";
import {
  GlobalSpotlight,
  useMobileDetection,
} from "@/src/animation/MagicBento";
import scss from "./Pillars.module.scss";

const GLOW_COLOR = "86, 187, 255"; // var(--color-accent) в rgb

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
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();

  return (
    <section id="pillars" className={scss.pillars}>
      <div className={`container ${scss.pillars__inner}`}>
        <h2 className={scss.pillars__heading}>Как мы работаем</h2>

        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={isMobile || !!safeMotion.reduce}
          spotlightRadius={220}
          glowColor={GLOW_COLOR}
        />

        <div ref={gridRef} className={`${scss.pillars__grid} bento-section`}>
          {STEPS.map((step) => (
            <article
              key={step.index}
              className={`${scss.pillar} magic-bento-card`}
              data-step={step.index}
            >
              <span className={scss.pillar__index}>{step.index}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
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
