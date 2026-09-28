import { FC } from "react";
import scss from "./Intro.module.scss";

// Server Component — static copy, no client pieces. The specialization
// grid below is this page's one visual payload, so the hero stays plain
// text: eyebrow, headline, one paragraph. No stat widget, no photo, no
// buttons here — kept deliberately sparse rather than repeating the
// crowded hero pattern already stripped out of the About page.
const Intro: FC = () => (
  <div className={`container ${scss.intro}`}>
    <span className={scss.intro__eyebrow}>Команда</span>
    <h1 className={scss.intro__title}>
      Специалисты, проверенные на реальных проектах
    </h1>
    <p className={scss.intro__lead}>
      В сообществе больше 120 участников по семи направлениям. Каждую команду
      курирует тимлид: он отвечает за архитектуру и ревью кода на каждом
      этапе, а не только на старте.
    </p>
  </div>
);

export default Intro;
