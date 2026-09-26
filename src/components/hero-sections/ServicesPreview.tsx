"use client";

import { FC, useRef } from "react";
import { useSafeMotion } from "@/src/hooks/use-safe-motion";
import Button from "@/src/ui/Button";
import {
  GlobalSpotlight,
  useMobileDetection,
} from "@/src/animation/MagicBento";
import scss from "./ServicesPreview.module.scss";

const GLOW_COLOR = "86, 187, 255"; // var(--color-accent) в rgb

const SERVICES = [
  {
    tag: "Landing & Sites",
    title: "Лендинги и сайты",
    description:
      "Быстрые маркетинговые сайты и корпоративные страницы на React и Next.js.",
  },
  {
    tag: "Web-systems",
    title: "Веб-системы",
    description:
      "CRM, LMS и панели управления — сложная бизнес-логика в понятном интерфейсе.",
  },
  {
    tag: "Telegram-bots",
    title: "Telegram-боты",
    description:
      "Автоматизация процессов и коммуникации прямо в мессенджере клиента.",
  },
  {
    tag: "AI-integrations",
    title: "AI-интеграции",
    description:
      "Чат-боты, компьютерное зрение и аналитика поверх готовых моделей.",
  },
];

const ServicesPreview: FC = () => {
  const safeMotion = useSafeMotion(16);
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();

  return (
    <section className={scss.services}>
      <div className={`container ${scss.services__inner}`}>
        <h2 className={scss.services__heading}>Что мы делаем</h2>

        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={isMobile || !!safeMotion.reduce}
          spotlightRadius={220}
          glowColor={GLOW_COLOR}
        />

        <div ref={gridRef} className={`${scss.services__grid} bento-section`}>
          {SERVICES.map((service) => (
            <article
              key={service.tag}
              className={`${scss.service} magic-bento-card`}
              data-tag={service.tag}
            >
              <div className={scss.service__content}>
                <span className={scss.service__tag}>{service.tag}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={scss.services__footer}>
          <Button href="/services" variant="ghost">
            Смотреть все услуги
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesPreview;
