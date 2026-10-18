import { FC } from "react";
import Button from "@/src/ui/Button";
import { TELEGRAM_URL } from "@/src/data/socials";
import scss from "./Doors.module.scss";

const STUDENT_POINTS = [
  "Сразу в работу над нашими продуктами, без тестового в стол",
  "Тимлид проверяет код и объясняет решения",
  "Компании, которые приходят к нам, видят твою работу",
];

// The closing call: one dark band split into a door per visitor instead of
// two cards; the half under the pointer or keyboard focus lights up.
const Doors: FC = () => (
  <section className={scss.doors}>
    <div className="container">
      <div className={scss.doors__grid}>
        <div className={scss.door}>
          <p className={scss.door__who}>Компаниям</p>
          <h2 className={scss.door__title}>Есть задача — соберём под неё команду</h2>
          <p className={scss.door__text}>
            Сайт, веб-система, бот или AI-интеграция. Расскажите о задаче, и мы
            предложим следующий шаг.
          </p>
          <Button href="/contact" className={scss.door__cta}>
            Заказать проект
          </Button>
        </div>

        <div className={scss.door}>
          <p className={scss.door__who}>Студентам</p>
          <h2 className={scss.door__title}>Хочешь в команду?</h2>
          <p className={scss.door__text}>
            Для студентов и начинающих разработчиков, которые хотят опыт на
            настоящих проектах.
          </p>
          <ul className={scss.door__points}>
            {STUDENT_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <Button href={TELEGRAM_URL} external variant="ghost" className={scss.door__cta}>
            Подать заявку в Telegram
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default Doors;
