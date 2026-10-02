import { FC, ReactNode } from "react";
import scss from "./admin-ui.module.scss";

const Panel: FC<{ title?: string; children: ReactNode }> = ({ title, children }) => (
  <section className={scss.panel}>
    {title && <h2 className={scss.panel__title}>{title}</h2>}
    {children}
  </section>
);

export default Panel;
