"use client";

import { FC, ReactNode, useActionState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import { CATEGORY_LABELS } from "@/src/data/projects";
import {
  submitClientRequest,
  type RequestFormState,
} from "@/src/actions/client-requests";
import scss from "./RequestForm.module.scss";

interface FieldProps {
  name: string;
  label: string;
  required?: boolean;
  full?: boolean;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
}

const Field: FC<FieldProps> = ({
  name,
  label,
  required,
  full,
  error,
  children,
}) => {
  const errorId = error ? `request-${name}-error` : undefined;
  return (
    <div className={`${scss.field} ${full ? scss["field--full"] : ""}`}>
      <label htmlFor={`request-${name}`}>
        {label} {required && <span className={scss.required}>*</span>}
      </label>
      {children(errorId)}
      {error && (
        <p id={errorId} className={scss.field__error}>
          {error}
        </p>
      )}
    </div>
  );
};

const INITIAL_STATE: RequestFormState = {};

// Form only — the page heading lives in contact-sections/Intro. Field
// names mirror the ClientRequest entity (ТЗ §9); the request lands in
// the admin's "Заявки".
const RequestForm: FC = () => {
  const [state, formAction, pending] = useActionState(
    submitClientRequest,
    INITIAL_STATE,
  );
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const value = (name: string) => state.values?.[name] ?? "";
  const inputProps = (name: string, describedBy: string | undefined) => ({
    id: `request-${name}`,
    name,
    defaultValue: value(name),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": describedBy,
  });

  return (
    // initial={false}: the form is server-rendered visible; only the
    // form → success swap animates.
    <AnimatePresence mode="wait" initial={false}>
      {state.ok ? (
        <motion.div
          key="success"
          className={scss.success}
          initial={{ opacity: 0, y: motionTokens.distance.sm }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: motionTokens.distance.sm }}
          transition={springs.snappy}
          role="status"
        >
          <h3>Заявка отправлена</h3>
          <p>Мы свяжемся с вами в ближайшее время.</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          className={scss.form}
          action={formAction}
          noValidate
          initial={{ opacity: 0, y: motionTokens.distance.sm }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: motionTokens.distance.sm }}
          transition={springs.snappy}
        >
          <Field name="name" label="Имя" required error={errors.name}>
            {(describedBy) => (
              <input
                {...inputProps("name", describedBy)}
                type="text"
                autoComplete="name"
                required
              />
            )}
          </Field>

          <Field name="company" label="Компания" error={errors.company}>
            {(describedBy) => (
              <input
                {...inputProps("company", describedBy)}
                type="text"
                autoComplete="organization"
              />
            )}
          </Field>

          <Field name="email" label="Email" required error={errors.email}>
            {(describedBy) => (
              <input
                {...inputProps("email", describedBy)}
                type="email"
                autoComplete="email"
                required
              />
            )}
          </Field>

          <Field name="phone" label="Телефон" error={errors.phone}>
            {(describedBy) => (
              <input
                {...inputProps("phone", describedBy)}
                type="tel"
                autoComplete="tel"
              />
            )}
          </Field>

          <Field
            name="title"
            label="Название проекта"
            required
            error={errors.title}
          >
            {(describedBy) => (
              <input
                {...inputProps("title", describedBy)}
                type="text"
                required
              />
            )}
          </Field>

          <Field
            name="projectType"
            label="Тип проекта"
            error={errors.projectType}
          >
            {(describedBy) => (
              <select {...inputProps("projectType", describedBy)}>
                <option value="">Выберите тип</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field
            name="budget"
            label="Бюджет (опционально)"
            error={errors.budget}
          >
            {(describedBy) => (
              <input
                {...inputProps("budget", describedBy)}
                type="text"
                placeholder="Например, 300 000 сом"
              />
            )}
          </Field>

          <Field
            name="description"
            label="Описание проекта"
            required
            full
            error={errors.description}
          >
            {(describedBy) => (
              <textarea
                {...inputProps("description", describedBy)}
                rows={5}
                required
              />
            )}
          </Field>

          {state.error && !pending && (
            <p role="alert" className={scss.alert}>
              {state.error}
            </p>
          )}

          <div className={scss.submitRow}>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Отправляем…" : "Отправить заявку"}
            </Button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
};

export default RequestForm;
