import { FC, ReactNode } from "react";
import scss from "./admin-ui.module.scss";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  full?: boolean;
  children: ReactNode;
}

// Pair with aria-describedby={`${htmlFor}-error`} on the control when
// `error` is set.
const Field: FC<FieldProps> = ({ label, htmlFor, error, hint, required, full, children }) => (
  <div className={`${scss.field} ${full ? scss["field--full"] : ""}`}>
    <label htmlFor={htmlFor}>
      {label}
      {required && <span className={scss.required}> *</span>}
    </label>
    {children}
    {hint && !error && <p className={scss.field__hint}>{hint}</p>}
    {error && (
      <p id={`${htmlFor}-error`} className={scss.field__error}>
        {error}
      </p>
    )}
  </div>
);

export default Field;
