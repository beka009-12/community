"use client";

import { FC, useRef } from "react";
import Link from "next/link";
import { motion, useScroll } from "motion/react";
import Avatar from "@/src/ui/Avatar";
import { positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { MemberListItem } from "@/src/server/api/schemas";
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

// The team leads sit under the steps because they are the review each
// step goes through.
const Process: FC<{ leads: MemberListItem[] }> = ({ leads }) => {
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

        <div className={scss.review}>
          <p className={scss.review__text}>Каждый этап проверяют тимлиды сообщества.</p>
          {leads.length > 0 && (
            <ul className={scss.review__leads}>
              {leads.map((lead) => {
                const name = fullName(lead);
                const position = positionLabel(lead.position);
                return (
                  <li key={lead.id}>
                    <Link href={`/team/${lead.id}`} className={scss.lead}>
                      <span className={scss.lead__avatar}>
                        <Avatar src={lead.avatar} name={name} />
                      </span>
                      <span className={scss.lead__text}>
                        <span className={scss.lead__name}>{name}</span>
                        <span className={scss.lead__role}>
                          {position ? `Тимлид, ${position}` : "Тимлид"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default Process;
