import { FC } from "react";
import scss from "./Intro.module.scss";

// Server Component — same sparse eyebrow / headline / lead hero as
// team-sections/Intro.
const Intro: FC = () => (
  <div className={`container ${scss.intro}`}>
    <span className={scss.intro__eyebrow}>Контакты</span>
    <h1 className={scss.intro__title}>Расскажите о проекте</h1>
    <p className={scss.intro__lead}>
      Опишите задачу в форме ниже. Мы изучим заявку, подберём команду под
      стек и сроки и вернёмся с вопросами или предложением.
    </p>
  </div>
);

export default Intro;
