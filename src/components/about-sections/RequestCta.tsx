import { FC } from "react";
import Button from "@/src/ui/Button";
import scss from "./RequestCta.module.scss";

// The request form itself lives on /contact; About only points there.
const RequestCta: FC = () => (
  <section className={scss.cta}>
    <div className={`container ${scss.cta__inner}`}>
      <span className={scss.cta__eyebrow}>
        <span className={scss.cta__index}>§ 06</span>
        Начать проект
      </span>
      <h2 className={scss.cta__title}>Есть задача? Расскажите о ней</h2>
      <p className={scss.cta__lead}>
        Заполните короткую заявку — подберём команду и ответим с деталями.
      </p>
      <Button href="/contact" variant="primary" className={scss.cta__button}>
        Оставить заявку
      </Button>
    </div>
  </section>
);

export default RequestCta;
