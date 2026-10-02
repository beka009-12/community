import { FC } from "react";
import Button from "@/src/ui/Button";
import CommunityPhoto from "./CommunityPhoto";
import scss from "./Intro.module.scss";

// Server Component — static copy, including CommunityPhoto (no client
// piece needed anymore now that the visual is one static image).
const Intro: FC = () => (
  <div className={`container ${scss.intro}`}>
    <div className={scss.intro__path}>MOTION / ABOUT</div>

    <div className={scss.intro__grid}>
      <div className={scss.intro__copy}>
        <span className={scss.intro__eyebrow}>
          <span className={scss.intro__index}>§ 01</span>About
        </span>
        <h1 className={scss.intro__title}>
          Мы объединяем людей и{" "}
          <span className={scss.shine}>реальные проекты</span>
        </h1>
        <p className={scss.intro__lead}>
          Motion Community — сообщество frontend, backend и AI/ML
          специалистов в Бишкеке. Мы растим их на реальных проектах и
          помогаем компаниям находить уже проверенных людей.
        </p>

        <Button href="/contact" variant="primary" className={scss.intro__cta}>
          Обсудить проект
        </Button>
      </div>

      <CommunityPhoto />
    </div>
  </div>
);

export default Intro;
