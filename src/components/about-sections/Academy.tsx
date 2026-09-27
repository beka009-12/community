import { FC } from "react";
import Button from "@/src/ui/Button";
import scss from "./Academy.module.scss";

// TODO: placeholder copy — swap for the real Motion Academy text once
// it's provided. motion.kg itself doesn't expose enough public content
// to write this honestly, so this stays generic until replaced.
const Academy: FC = () => (
  <section className={scss.academy}>
    <div className={`container ${scss.academy__panel}`}>
      <div className={scss.academy__content}>
        <span className={scss.academy__eyebrow}>Откуда мы берём людей</span>
        <h2 className={scss.academy__title}>Motion Academy</h2>
        <p className={scss.academy__text}>
          Motion Academy — образовательная площадка, где будущие участники
          сообщества готовятся к работе над реальными проектами ещё до того,
          как попадают в команду.
        </p>
      </div>

      <Button
        href="https://motion.kg"
        variant="ghost"
        external
        className={scss.academy__cta}
      >
        Перейти на motion.kg
      </Button>
    </div>
  </section>
);

export default Academy;
