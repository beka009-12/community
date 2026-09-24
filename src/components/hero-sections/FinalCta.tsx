"use client";

import { FC } from "react";
import Button from "@/src/ui/Button";
import scss from "./FinalCta.module.scss";

const FinalCta: FC = () => {
  return (
    <section className={scss.finalCta}>
      <div className={`container ${scss.finalCta__inner}`}>
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
      </div>
    </section>
  );
};

export default FinalCta;
