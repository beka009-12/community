import { FC } from "react";
import scss from "./admin-ui.module.scss";

const FormSection: FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className={scss.formSection}>
    <h3 className={scss.formSection__title}>{title}</h3>
    {hint && <p className={scss.formSection__hint}>{hint}</p>}
  </div>
);

export default FormSection;
