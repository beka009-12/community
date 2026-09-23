"use client";

import { FC } from "react";
import { motion } from "motion/react";
import { useSafeMotion } from "@/src/hooks/use-safe-motion";
import { springs } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import scss from "./ServicesPreview.module.scss";

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

  return (
    <section className={scss.services}>
      <div className={`container ${scss.services__inner}`}>
        <h2 className={scss.services__heading}>Что мы делаем</h2>

        <div className={scss.services__grid}>
          {SERVICES.map((service, i) => (
            <motion.article
              key={service.tag}
              className={scss.service}
              initial={safeMotion.initial}
              whileInView={safeMotion.animate}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ ...springs.gentle, delay: i * 0.08 }}
            >
              <span className={scss.service__tag}>{service.tag}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </motion.article>
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
