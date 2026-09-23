"use client";

import { FC } from "react";
import { motion } from "motion/react";
import { useSafeMotion } from "@/src/hooks/use-safe-motion";
import { springs } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import scss from "./FinalCta.module.scss";

const FinalCta: FC = () => {
  const safeMotion = useSafeMotion(16);

  return (
    <section className={scss.finalCta}>
      <motion.div
        className={`container ${scss.finalCta__inner}`}
        initial={safeMotion.initial}
        whileInView={safeMotion.animate}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={springs.gentle}
      >
        <h2 className={scss.finalCta__heading}>
          Есть задача — обсудим, как её решить
        </h2>
        <p className={scss.finalCta__text}>
          Пишите напрямую в Telegram или WhatsApp — ответим и предложим
          следующий шаг без долгих анкет.
        </p>

        <div className={scss.finalCta__actions}>
          <Button href="https://t.me/" external variant="primary">
            Обсудить проект
          </Button>
          <Button href="/team" variant="ghost">
            Присоединиться к комьюнити
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default FinalCta;
