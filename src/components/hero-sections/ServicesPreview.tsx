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

const ServiceIcon: FC<{ tag: string }> = ({ tag }) => {
  const common = {
    className: scss.service__glyph,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (tag) {
    case "web":
      return (
        <svg {...common} strokeWidth={1.6}>
          <path d="M9.5 7 5 12l4.5 5" />
          <path d="M14.5 7 19 12l-4.5 5" />
        </svg>
      );
    case "systems":
      return (
        <svg {...common} strokeWidth={1.5}>
          <rect x="3" y="4" width="18" height="6" rx="1.5" />
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <circle cx="7" cy="7" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="7" cy="17" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "bots":
      // бумажный самолётик — как иконка отправки в Telegram
      return (
        <svg {...common} strokeWidth={1.5}>
          <path d="M21.5 2.5 10.8 13.2" />
          <path d="M21.5 2.5 14.9 21l-4-7.8-7.8-4 18.4-6.7Z" />
        </svg>
      );
    case "ai":
      // робот
      return (
        <svg {...common} strokeWidth={1.5}>
          <path d="M12 3v3" />
          <rect x="5" y="9" width="14" height="11" rx="3" />
          <circle cx="9.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
          <path d="M9 18h6" />
          <path d="M2 13v3" />
          <path d="M22 13v3" />
        </svg>
      );
    default:
      return null;
  }
};

const SERVICES = [
  {
    tag: "web",
    title: "Лендинги и сайты",
    description:
      "Быстрые маркетинговые сайты и корпоративные страницы на React и Next.js.",
  },
  {
    tag: "systems",
    title: "Веб-системы",
    description:
      "CRM, LMS и панели управления — сложная бизнес-логика в понятном интерфейсе.",
  },
  {
    tag: "bots",
    title: "Telegram-боты",
    description:
      "Автоматизация процессов и коммуникации прямо в мессенджере клиента.",
  },
  {
    tag: "ai",
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

        <div
          ref={gridRef}
          className={`${scss.services__grid} bento-section`}
        >
          {SERVICES.map((service) => (
            <article
              key={service.tag}
              className={`${scss.service} magic-bento-card`}
              data-tag={service.tag}
            >
              <ServiceIcon tag={service.tag} />

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
