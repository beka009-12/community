"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import FormSection from "@/src/components/admin/ui/FormSection";
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
  const selectProps = (name: TextField) => ({
    id: `project-${name}`,
    name,
    defaultValue: state.values?.[name] ?? initial[name],
    invalid: Boolean(errors[name]),
    describedBy: errors[name] ? `project-${name}-error` : undefined,
    block: true,
  });
  const toOptions = (labels: Record<string, string>) =>
    Object.entries(labels).map(([value, label]) => ({ value, label }));
  const featured = state.values ? state.values.featured === "on" : initial.featured;

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <FormSection title="О проекте" />
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

      <FormSection title="Публикация" hint="Статус и категория видны в портфолио на сайте." />
      <Field label="Статус" htmlFor="project-status" required error={errors.status}>
        <Select {...selectProps("status")} options={toOptions(STATUS_LABELS)} />
      </Field>
      <Field label="Категория" htmlFor="project-category" required error={errors.category}>
        <Select {...selectProps("category")} options={toOptions(CATEGORY_LABELS)} />
      </Field>

      <Field label="Источник" htmlFor="project-origin" required error={errors.origin}>
        <Select
          {...selectProps("origin")}
          options={[
            { value: "community", label: "Проект сообщества" },
            { value: "client", label: "Проект на заказ" },
          ]}
        />
      </Field>
      <Field label="Год" htmlFor="project-year" required error={errors.year}>
        <input {...control("year")} inputMode="numeric" />
      </Field>

      <FormSection title="Медиа и ссылки" />
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
