import { FC } from "react";
import Button from "@/src/ui/Button";
import { TELEGRAM_URL } from "@/src/data/socials";
import scss from "./Closing.module.scss";

const Closing: FC = () => (
  <section className={scss.closing}>
    <div className="container">
      <h2 className={scss.closing__title}>Есть задача или хочешь в команду?</h2>
      <p className={scss.closing__text}>
        Компаниям: заявка на проект. Студентам: заявка в сообщество.
      </p>
      <div className={scss.closing__actions}>
        <Button href="/contact">Заказать проект</Button>
        <Button href={TELEGRAM_URL} external variant="ghost">
          Вступить в сообщество
        </Button>
      </div>
    </div>
  </section>
);

export default Closing;
