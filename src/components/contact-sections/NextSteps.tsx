import { FC } from "react";
import { SOCIAL_LINKS } from "@/src/data/socials";
import scss from "./NextSteps.module.scss";

interface Step {
  title: string;
  text: string;
}

// Mirrors "Сценарий 4 — клиент" from the platform plan: the request
// lands with Admin, who assembles a team before anyone talks budget.
const STEPS: Step[] = [
  {
    title: "Разбираем заявку",
    text: "Читаем описание и уточняем детали, если чего-то не хватает.",
  },
  {
    title: "Собираем команду",
    text: "Подбираем тимлида и участников под стек и сроки проекта.",
  },
  {
    title: "Созваниваемся",
    text: "Обсуждаем с тимлидом объём, этапы и бюджет.",
  },
];

const DIRECT_CHANNELS = SOCIAL_LINKS.filter(
  (link) => link.label === "Telegram" || link.label === "WhatsApp",
);

const NextSteps: FC = () => (
  <aside className={scss.steps}>
    <h2 className={scss.steps__title}>Что будет дальше</h2>
    <ol className={scss.steps__list}>
      {STEPS.map((step, index) => (
        <li key={step.title} className={scss.step}>
          <span className={scss.step__number}>{index + 1}</span>
          <div>
            <h3 className={scss.step__title}>{step.title}</h3>
            <p className={scss.step__text}>{step.text}</p>
          </div>
        </li>
      ))}
    </ol>

    <div className={scss.direct}>
      <p className={scss.direct__text}>Удобнее написать напрямую?</p>
      <ul className={scss.direct__list}>
        {DIRECT_CHANNELS.map((channel) => (
          <li key={channel.href}>
            <a href={channel.href} target="_blank" rel="noreferrer">
              {channel.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

export default NextSteps;
