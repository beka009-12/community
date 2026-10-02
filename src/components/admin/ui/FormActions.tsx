import { FC } from "react";
import Button from "@/src/ui/Button";
import scss from "./admin-ui.module.scss";

interface FormActionsProps {
  submitLabel: string;
  pending: boolean;
  error?: string;
  saved?: boolean;
}

const FormActions: FC<FormActionsProps> = ({ submitLabel, pending, error, saved }) => (
  <div className={scss.formActions}>
    {error && !pending && (
      <p role="alert" className={scss.alert}>
        {error}
      </p>
    )}
    {saved && !pending && !error && (
      <p role="status" className={scss.saved}>
        Сохранено
      </p>
    )}
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Сохраняем…" : submitLabel}
    </Button>
  </div>
);

export default FormActions;
