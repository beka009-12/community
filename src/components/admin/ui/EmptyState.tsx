import { FC, ReactNode } from "react";
import scss from "./admin-ui.module.scss";

const EmptyState: FC<{ title: string; children?: ReactNode }> = ({ title, children }) => (
  <div className={scss.emptyState}>
    <p className={scss.emptyState__title}>{title}</p>
    {children}
  </div>
);

export default EmptyState;
