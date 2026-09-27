import { FC } from "react";
import ServiceQuickNav from "./ServiceQuickNav";
import scss from "./Intro.module.scss";

// Server Component — static copy, matches the mission statement already
// established on the homepage (Welcome.tsx), just as the page's own lead.
// ServiceQuickNav is the one client-interactive piece, rendered as a
// child same as HeroImage/TeamSection are on the project detail page.
const Intro: FC = () => (
  <div className={`container ${scss.intro}`}>
    <span className={scss.intro__eyebrow}>About</span>
    <h1 className={scss.intro__title}>
      Мы объединяем людей и <span className={scss.shine}>реальные проекты</span>
    </h1>
    <p className={scss.intro__lead}>
      Motion Community — сообщество frontend, backend и AI/ML специалистов в
      Бишкеке. Мы растим их на реальных проектах и помогаем компаниям
      находить уже проверенных людей.
    </p>

    <ServiceQuickNav />
  </div>
);

export default Intro;
