import { FC } from "react";
import Button from "@/src/ui/Button";
import { TELEGRAM_URL } from "@/src/data/socials";
import scss from "./JoinBand.module.scss";

const POINTS = [
  {
    title: "Сразу в работу",
    text: "Начинаешь с задачи в одном из наших продуктов, а не с тестового задания в стол.",
  },
  {
    title: "Тимлид рядом",
    text: "Код проходит ревью, решения объясняют.",
  },
  {
    title: "Путь к найму",
    text: "Компании, которые приходят к нам, видят твою работу.",
  },
];

// The only light section on the page: the contrast is what separates the
// student path from the company path above.
const JoinBand: FC = () => (
  <section className={scss.join}>
    <div className="container">
      <h2 className={scss.join__title}>Хочешь в команду?</h2>
      <p className={scss.join__lead}>
        Для студентов и начинающих разработчиков, которые хотят опыт на
        настоящих проектах.
      </p>

      <ul className={scss.points}>
        {POINTS.map((point) => (
          <li key={point.title}>
            <h3 className={scss.point__title}>{point.title}</h3>
            <p className={scss.point__text}>{point.text}</p>
          </li>
        ))}
      </ul>

      <Button href={TELEGRAM_URL} external className={scss.join__cta}>
        Подать заявку в Telegram
      </Button>
    </div>
  </section>
);

export default JoinBand;
