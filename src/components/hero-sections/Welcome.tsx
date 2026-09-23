"use client";

import { FC } from "react";
import HeroLogoParticles from "@/src/animation/HeroLogoParticles";
import scss from "./Welcome.module.scss";

const Welcome: FC = () => {
  return (
    <section className={scss.hero}>
      <div className={`container ${scss.hero__content}`}>
        <div className={scss.topcopy}>
          <p>
            Мы объединяем frontend, backend и AI/ML специалистов в одном
            сообществе — растим их на реальных проектах и помогаем компаниям
            находить уже проверенных людей.
          </p>
          <p>120+ специалистов • Frontend • Backend • AI/ML</p>
        </div>

        <div className={scss.center}>
          <div>
            <div className={scss.kicker}>
              Motion Community • where talent gets hired
            </div>
            <h1 className={scss.headline}>
              Talent becomes
              <br />
              <span className={scss.shine}>your next hire.</span>
            </h1>
            <a href="#community" className={scss.cta}>
              Смотреть community <span>→</span>
            </a>
          </div>

          <div className={scss.logoZone}>
            <div className={scss.logoStage}>
              <HeroLogoParticles
                className={scss.logoStage__marks}
                ariaLabel="Motion Community"
              />
              <div className={scss.logoCaption}>assembled by motion</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Welcome;
