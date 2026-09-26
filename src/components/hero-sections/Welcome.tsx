"use client";

import { FC } from "react";
import Image from "next/image";
import HeroLogoParticles from "@/src/animation/HeroLogoParticles";
import { useMediaQuery } from "@/src/hooks/useMediaQuery";
import scss from "./Welcome.module.scss";

const Welcome: FC = () => {
  // ≤1024px covers phone and tablet — below that the particle canvas has
  // no room to breathe next to the headline, so it's swapped for a static
  // photo background instead of running the animation at all.
  const isCompact = useMediaQuery("(max-width: 1024px)");

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
          <div className={scss.copy}>
            {isCompact && (
              <Image
                src="/brand/motion-logo-particles.png"
                alt=""
                aria-hidden="true"
                width={85}
                height={57}
                className={scss.heroGlyph}
              />
            )}

            <div className={scss.kicker}>
              Motion Community • where talent gets hired
            </div>
            <h1 className={scss.headline}>
              Talent becomes
              <br />
              <span className={scss.shine}>your next hire.</span>
            </h1>

            {isCompact && (
              <div className={scss.brandMark}>
                <span className={scss.brandMark__caption}>
                  assembled by motion group
                </span>
              </div>
            )}
          </div>

          {!isCompact && (
            <div className={scss.logoZone}>
              <div className={scss.logoStage}>
                <HeroLogoParticles
                  className={scss.logoStage__marks}
                  ariaLabel="Motion Community"
                />
                <div className={scss.logoCaption}>assembled by motion</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Welcome;
