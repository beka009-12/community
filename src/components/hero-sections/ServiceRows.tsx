import { FC } from "react";
import Link from "next/link";
import Button from "@/src/ui/Button";
import { SERVICES } from "@/src/data/services";
import scss from "./ServiceRows.module.scss";

// Large-type rows on hairlines instead of another card grid. The About
// services tabs always open on the first tab, so every row shares one link.
const ServiceRows: FC = () => (
  <section className={scss.services}>
    <div className="container">
      <div className={scss.services__head}>
        <div>
          <h2 className={scss.services__title}>Что сделаем для вашей компании</h2>
          <p className={scss.services__lead}>
            Та же команда, тот же процесс, только под вашу задачу.
          </p>
        </div>
        <Button href="/contact">Заказать проект</Button>
      </div>

      <ul className={scss.list}>
        {SERVICES.map((service) => (
          <li key={service.category}>
            <Link href="/about#services" className={scss.row}>
              <span className={scss.row__title}>{service.title}</span>
              <span className={scss.row__text}>{service.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default ServiceRows;
