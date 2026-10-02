"use client";

import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/admin/form-state";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/src/data/projects";

export interface ProjectFormValues {
  id: string;
  name: string;
  description: string;
  details: string;
  status: string;
  category: string;
  origin: string;
  year: string;
  image: string;
  stack: string;
  demoUrl: string;
  githubUrl: string;
  featured: boolean;
}

interface ProjectFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: ProjectFormValues;
  isNew?: boolean;
  submitLabel: string;
}

type TextField = Exclude<keyof ProjectFormValues, "featured">;

const ProjectForm: FC<ProjectFormProps> = ({ action, initial, isNew, submitLabel }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const control = (name: TextField) => ({
    id: `project-${name}`,
    name,
    defaultValue: state.values?.[name] ?? initial[name],
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `project-${name}-error` : undefined,
  });
  const featured = state.values ? state.values.featured === "on" : initial.featured;

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      {isNew && (
        <Field label="Адрес страницы" htmlFor="project-id" required error={errors.id} hint="Будет /projects/адрес — потом не меняется">
          <input {...control("id")} spellCheck={false} />
        </Field>
      )}
      <Field label="Название" htmlFor="project-name" required error={errors.name}>
        <input {...control("name")} />
      </Field>

      <Field label="Короткое описание" htmlFor="project-description" required error={errors.description} full>
        <input {...control("description")} />
      </Field>
      <Field label="Подробно" htmlFor="project-details" error={errors.details} full>
        <textarea {...control("details")} rows={4} />
      </Field>

      <Field label="Статус" htmlFor="project-status" required error={errors.status}>
        <select {...control("status")}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Категория" htmlFor="project-category" required error={errors.category}>
        <select {...control("category")}>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Источник" htmlFor="project-origin" required error={errors.origin}>
        <select {...control("origin")}>
          <option value="community">Проект сообщества</option>
          <option value="client">Проект на заказ</option>
        </select>
      </Field>
      <Field label="Год" htmlFor="project-year" required error={errors.year}>
        <input {...control("year")} inputMode="numeric" />
      </Field>

      <Field label="Превью (ссылка на картинку)" htmlFor="project-image" required error={errors.image} full>
        <input {...control("image")} type="url" />
      </Field>
      <Field label="Стек" htmlFor="project-stack" error={errors.stack} hint="Через запятую" full>
        <input {...control("stack")} />
      </Field>

      <Field label="Демо" htmlFor="project-demoUrl" error={errors.demoUrl}>
        <input {...control("demoUrl")} type="url" placeholder="https://…" />
      </Field>
      <Field label="GitHub" htmlFor="project-githubUrl" error={errors.githubUrl}>
        <input {...control("githubUrl")} type="url" placeholder="https://github.com/…" />
      </Field>

      <label className={scss.checkbox}>
        <input type="checkbox" name="featured" defaultChecked={featured} />
        Показывать на главной
      </label>

      <FormActions submitLabel={submitLabel} pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default ProjectForm;
